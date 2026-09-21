package com.sporthub.auth;

import java.time.Instant;
import java.util.UUID;

public record AuthResponse(
        String accessToken, String refreshToken, String tokenType, UUID userId, String email, String role) {

    public static AuthResponse of(String accessToken, String refreshToken, UUID userId, String email, String role) {
        return new AuthResponse(accessToken, refreshToken, "Bearer", userId, email, role);
    }

    public record Info(UUID id, String email, String fullName, boolean mfaRequired, Instant createdAt) {}
}
