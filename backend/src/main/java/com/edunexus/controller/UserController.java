package com.edunexus.controller;

import com.edunexus.domain.User;
import com.edunexus.dto.UpdateProfileRequest;
import com.edunexus.dto.UserDto;
import com.edunexus.repository.UserRepository;
import com.edunexus.security.UserPrincipal;
import com.edunexus.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users")
@PreAuthorize("isAuthenticated()")
public class UserController {

    private final UserRepository userRepository;

    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("/profile")
    public ResponseEntity<UserDto> getProfile(@AuthenticationPrincipal UserPrincipal principal) {
        User user = userRepository.findById(principal.getId())
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return ResponseEntity.ok(AuthService.mapToDto(user));
    }

    @PatchMapping("/profile")
    public ResponseEntity<UserDto> updateProfile(
        @AuthenticationPrincipal UserPrincipal principal,
        @Valid @RequestBody UpdateProfileRequest request
    ) {
        User user = userRepository.findById(principal.getId())
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (request.firstName() != null && !request.firstName().isBlank()) {
            user.setFirstName(request.firstName().trim());
        }
        if (request.lastName() != null && !request.lastName().isBlank()) {
            user.setLastName(request.lastName().trim());
        }
        if (request.phoneNumber() != null) {
            user.setPhoneNumber(request.phoneNumber().trim());
        }
        if (request.avatarUrl() != null) {
            user.setAvatarUrl(request.avatarUrl().trim());
        }
        if (request.bio() != null) {
            user.setBio(request.bio().trim());
        }

        User updatedUser = userRepository.save(user);
        return ResponseEntity.ok(AuthService.mapToDto(updatedUser));
    }
}
