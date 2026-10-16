package com.edunexus.dto;

public record AuthResponse(
    boolean success,
    String message,
    UserDto user,
    String token
) {
    public static AuthResponse of(UserDto user, String token, String message) {
        return new AuthResponse(true, message, user, token);
    }
}
