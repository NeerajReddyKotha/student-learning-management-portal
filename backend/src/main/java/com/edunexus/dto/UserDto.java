package com.edunexus.dto;

import java.time.Instant;
import java.util.Set;
import java.util.UUID;

public record UserDto(
    UUID id,
    String email,
    String firstName,
    String lastName,
    boolean emailVerified,
    Set<String> roles,
    String phoneNumber,
    String avatarUrl,
    String bio,
    Instant createdAt
) {}
