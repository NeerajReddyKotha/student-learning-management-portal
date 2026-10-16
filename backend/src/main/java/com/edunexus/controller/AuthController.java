package com.edunexus.controller;

import com.edunexus.dto.*;
import com.edunexus.security.JwtAuthenticationFilter;
import com.edunexus.security.UserPrincipal;
import com.edunexus.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(
        @Valid @RequestBody RegisterRequest request,
        HttpServletRequest httpRequest,
        HttpServletResponse httpResponse
    ) {
        String clientIp = getClientIp(httpRequest);
        String userAgent = httpRequest.getHeader(HttpHeaders.USER_AGENT);

        AuthResponse authResponse = authService.register(request, clientIp, userAgent);
        attachHttpOnlyCookie(httpResponse, authResponse.token(), Duration.ofDays(7));

        return ResponseEntity.status(HttpStatus.CREATED).body(authResponse);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
        @Valid @RequestBody LoginRequest request,
        HttpServletRequest httpRequest,
        HttpServletResponse httpResponse
    ) {
        String clientIp = getClientIp(httpRequest);
        String userAgent = httpRequest.getHeader(HttpHeaders.USER_AGENT);

        AuthResponse authResponse = authService.login(request, clientIp, userAgent);
        attachHttpOnlyCookie(httpResponse, authResponse.token(), Duration.ofDays(7));

        return ResponseEntity.ok(authResponse);
    }

    @PostMapping("/logout")
    public ResponseEntity<MessageResponse> logout(HttpServletResponse httpResponse) {
        // Clear HTTP-only authentication cookie
        ResponseCookie clearCookie = ResponseCookie.from(JwtAuthenticationFilter.COOKIE_NAME, "")
            .httpOnly(true)
            .secure(false) // set true in TLS/production
            .path("/")
            .maxAge(0)
            .sameSite("Lax")
            .build();
        httpResponse.addHeader(HttpHeaders.SET_COOKIE, clearCookie.toString());

        return ResponseEntity.ok(MessageResponse.ok("Logout successful"));
    }

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UserDto> getCurrentUser(@AuthenticationPrincipal UserPrincipal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        UserDto userDto = authService.getCurrentUser(principal);
        return ResponseEntity.ok(userDto);
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<MessageResponse> forgotPassword(
        @Valid @RequestBody ForgotPasswordRequest request,
        HttpServletRequest httpRequest
    ) {
        String clientIp = getClientIp(httpRequest);
        MessageResponse response = authService.forgotPassword(request, clientIp);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/reset-password")
    public ResponseEntity<MessageResponse> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        MessageResponse response = authService.resetPassword(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/verify-email")
    public ResponseEntity<MessageResponse> verifyEmail(@Valid @RequestBody VerifyEmailRequest request) {
        MessageResponse response = authService.verifyEmail(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/csrf")
    public ResponseEntity<Map<String, String>> getCsrfToken(HttpServletRequest request) {
        CsrfToken csrfToken = (CsrfToken) request.getAttribute(CsrfToken.class.getName());
        if (csrfToken != null) {
            return ResponseEntity.ok(Map.of(
                "token", csrfToken.getToken(),
                "headerName", csrfToken.getHeaderName(),
                "parameterName", csrfToken.getParameterName()
            ));
        }
        return ResponseEntity.ok(Map.of("message", "CSRF is handled via CookieCsrfTokenRepository"));
    }

    private void attachHttpOnlyCookie(HttpServletResponse response, String token, Duration duration) {
        ResponseCookie cookie = ResponseCookie.from(JwtAuthenticationFilter.COOKIE_NAME, token)
            .httpOnly(true)
            .secure(false) // true in HTTPS production
            .path("/")
            .maxAge(duration)
            .sameSite("Lax")
            .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private String getClientIp(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null || xfHeader.isBlank()) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0].trim();
    }
}
