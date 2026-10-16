package com.edunexus.dto;

import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
    @Size(max = 100, message = "First name must not exceed 100 characters")
    String firstName,

    @Size(max = 100, message = "Last name must not exceed 100 characters")
    String lastName,

    @Size(max = 32, message = "Phone number must not exceed 32 characters")
    String phoneNumber,

    @Size(max = 512, message = "Avatar URL must not exceed 512 characters")
    String avatarUrl,

    @Size(max = 2000, message = "Bio must not exceed 2000 characters")
    String bio
) {}
