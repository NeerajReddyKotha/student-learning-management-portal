package com.edunexus.service;

import com.edunexus.domain.*;
import com.edunexus.dto.*;
import com.edunexus.repository.*;
import com.edunexus.security.JwtTokenProvider;
import com.edunexus.security.RateLimitingService;
import com.edunexus.security.UserPrincipal;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final EmailVerificationTokenRepository emailVerificationTokenRepository;
    private final UserLoginAttemptRepository userLoginAttemptRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final RateLimitingService rateLimitingService;

    public AuthService(
        UserRepository userRepository,
        RoleRepository roleRepository,
        PasswordResetTokenRepository passwordResetTokenRepository,
        EmailVerificationTokenRepository emailVerificationTokenRepository,
        UserLoginAttemptRepository userLoginAttemptRepository,
        PasswordEncoder passwordEncoder,
        JwtTokenProvider tokenProvider,
        RateLimitingService rateLimitingService
    ) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.emailVerificationTokenRepository = emailVerificationTokenRepository;
        this.userLoginAttemptRepository = userLoginAttemptRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
        this.rateLimitingService = rateLimitingService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request, String ipAddress, String userAgent) {
        if (rateLimitingService.isRateLimited(ipAddress, request.email())) {
            throw new RateLimitExceededException("Too many registration requests. Please wait a moment.");
        }

        if (userRepository.existsByEmailIgnoreCase(request.email())) {
            throw new IllegalArgumentException("An account with this email already exists");
        }

        // CRITICAL SECURITY RULE: Public registration strictly assigns ROLE_STUDENT.
        // Privileged roles (ROLE_TRAINER, ROLE_ADMIN) can only be granted by existing Administrators.
        Role studentRole = roleRepository.findByName("ROLE_STUDENT")
            .orElseGet(() -> roleRepository.save(new Role("ROLE_STUDENT", "Enrolled learner")));

        User user = User.builder()
            .email(request.email().trim().toLowerCase())
            .passwordHash(passwordEncoder.encode(request.password()))
            .firstName(request.firstName().trim())
            .lastName(request.lastName().trim())
            .active(true)
            .emailVerified(false)
            .roles(new HashSet<>(Collections.singletonList(studentRole)))
            .build();

        User savedUser = userRepository.save(user);

        // Generate email verification token (24-hour expiration)
        String rawVerificationToken = UUID.randomUUID().toString();
        String tokenHash = tokenProvider.hashOpaqueToken(rawVerificationToken);

        EmailVerificationToken verificationToken = EmailVerificationToken.builder()
            .user(savedUser)
            .tokenHash(tokenHash)
            .expiresAt(Instant.now().plus(24, ChronoUnit.HOURS))
            .build();
        emailVerificationTokenRepository.save(verificationToken);

        UserPrincipal principal = new UserPrincipal(savedUser);
        String jwt = tokenProvider.generateToken(principal);

        return AuthResponse.of(mapToDto(savedUser), jwt, "Registration successful. Welcome to EduNexus Academy!");
    }

    @Transactional
    public AuthResponse login(LoginRequest request, String ipAddress, String userAgent) {
        String cleanEmail = request.email().trim().toLowerCase();

        if (rateLimitingService.isRateLimited(ipAddress, cleanEmail)) {
            throw new RateLimitExceededException("Too many failed attempts. Please try again after 1 minute.");
        }

        Optional<User> userOpt = userRepository.findByEmailIgnoreCase(cleanEmail);

        if (userOpt.isEmpty()) {
            recordAttempt(cleanEmail, ipAddress, userAgent, false);
            throw new BadCredentialsException("Invalid email or password");
        }

        User user = userOpt.get();

        if (!user.isAccountNonLocked()) {
            recordAttempt(cleanEmail, ipAddress, userAgent, false);
            throw new AccountLockedException("Account is temporarily locked due to multiple failed login attempts. Try again later.");
        }

        if (!user.isActive()) {
            recordAttempt(cleanEmail, ipAddress, userAgent, false);
            throw new BadCredentialsException("Account is deactivated");
        }

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            user.setFailedLoginAttempts(user.getFailedLoginAttempts() + 1);
            if (user.getFailedLoginAttempts() >= 5) {
                user.setLockedUntil(Instant.now().plus(15, ChronoUnit.MINUTES));
                log.warn("Account {} temporarily locked due to 5 consecutive failed attempts", cleanEmail);
            }
            userRepository.save(user);
            recordAttempt(cleanEmail, ipAddress, userAgent, false);
            throw new BadCredentialsException("Invalid email or password");
        }

        // Successful authentication
        user.setFailedLoginAttempts(0);
        user.setLockedUntil(null);
        userRepository.save(user);
        recordAttempt(cleanEmail, ipAddress, userAgent, true);
        rateLimitingService.recordSuccessfulLogin(cleanEmail);

        UserPrincipal principal = new UserPrincipal(user);
        String jwt = tokenProvider.generateToken(principal);

        return AuthResponse.of(mapToDto(user), jwt, "Login successful");
    }

    @Transactional
    public MessageResponse forgotPassword(ForgotPasswordRequest request, String ipAddress) {
        String cleanEmail = request.email().trim().toLowerCase();

        if (rateLimitingService.isRateLimited(ipAddress, cleanEmail)) {
            throw new RateLimitExceededException("Too many password reset requests. Please try again later.");
        }

        // Anti-enumeration: always return same message whether email exists or not
        Optional<User> userOpt = userRepository.findByEmailIgnoreCase(cleanEmail);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            passwordResetTokenRepository.deleteByUser(user);

            String rawToken = UUID.randomUUID().toString();
            String tokenHash = tokenProvider.hashOpaqueToken(rawToken);

            PasswordResetToken resetToken = PasswordResetToken.builder()
                .user(user)
                .tokenHash(tokenHash)
                .expiresAt(Instant.now().plus(15, ChronoUnit.MINUTES))
                .build();
            passwordResetTokenRepository.save(resetToken);

            log.info("Password reset token generated for user ID: {}", user.getId());
        }

        return MessageResponse.ok("If an account exists with this email, password reset instructions have been dispatched.");
    }

    @Transactional
    public MessageResponse resetPassword(ResetPasswordRequest request) {
        String tokenHash = tokenProvider.hashOpaqueToken(request.token().trim());
        PasswordResetToken resetToken = passwordResetTokenRepository.findByTokenHashAndUsedAtIsNull(tokenHash)
            .orElseThrow(() -> new IllegalArgumentException("Invalid or expired password reset token"));

        if (!resetToken.isValid()) {
            throw new IllegalArgumentException("Password reset token has expired or already been used");
        }

        User user = resetToken.getUser();
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        user.setFailedLoginAttempts(0);
        user.setLockedUntil(null);
        userRepository.save(user);

        resetToken.setUsedAt(Instant.now());
        passwordResetTokenRepository.save(resetToken);

        return MessageResponse.ok("Password has been successfully updated. You may now log in with your new credentials.");
    }

    @Transactional
    public MessageResponse verifyEmail(VerifyEmailRequest request) {
        String tokenHash = tokenProvider.hashOpaqueToken(request.token().trim());
        EmailVerificationToken verificationToken = emailVerificationTokenRepository.findByTokenHashAndUsedAtIsNull(tokenHash)
            .orElseThrow(() -> new IllegalArgumentException("Invalid or expired email verification token"));

        if (!verificationToken.isValid()) {
            throw new IllegalArgumentException("Verification token has expired or already been used");
        }

        User user = verificationToken.getUser();
        user.setEmailVerified(true);
        user.setEmailVerifiedAt(Instant.now());
        userRepository.save(user);

        verificationToken.setUsedAt(Instant.now());
        emailVerificationTokenRepository.save(verificationToken);

        return MessageResponse.ok("Email address successfully verified.");
    }

    @Transactional(readOnly = true)
    public UserDto getCurrentUser(UserPrincipal principal) {
        User user = userRepository.findById(principal.getId())
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return mapToDto(user);
    }

    private void recordAttempt(String email, String ip, String userAgent, boolean success) {
        try {
            userLoginAttemptRepository.save(UserLoginAttempt.builder()
                .email(email)
                .ipAddress(ip)
                .userAgent(userAgent)
                .successful(success)
                .build());
        } catch (Exception ex) {
            log.error("Failed to record login attempt audit", ex);
        }
    }

    public static UserDto mapToDto(User user) {
        Set<String> roles = user.getRoles().stream()
            .map(Role::getName)
            .collect(Collectors.toSet());

        return new UserDto(
            user.getId(),
            user.getEmail(),
            user.getFirstName(),
            user.getLastName(),
            user.isEmailVerified(),
            roles,
            user.getPhoneNumber(),
            user.getAvatarUrl(),
            user.getBio(),
            user.getCreatedAt()
        );
    }

    public static class RateLimitExceededException extends RuntimeException {
        public RateLimitExceededException(String message) {
            super(message);
        }
    }

    public static class AccountLockedException extends RuntimeException {
        public AccountLockedException(String message) {
            super(message);
        }
    }
}
