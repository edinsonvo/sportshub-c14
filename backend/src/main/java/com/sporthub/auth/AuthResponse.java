package com.sporthub.auth;

import com.sporthub.auth.mfa.MfaMethod;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record AuthResponse(
        String accessToken,
        String refreshToken,
        String tokenType,
        UUID userId,
        String email,
        String role,
        boolean mfaRequired,
        List<MfaMethod> mfaMethods,
        String challengeToken) {

    public static AuthResponse of(String accessToken, String refreshToken, UUID userId, String email, String role) {
        return new AuthResponse(accessToken, refreshToken, "Bearer", userId, email, role, false, List.of(), null);
    }

    public static AuthResponse pending(UUID userId, String email, String role, List<MfaMethod> methods, String challenge) {
        return new AuthResponse(null, null, null, userId, email, role, true, methods, challenge);
    }

    public record Info(UUID id, String email, String fullName, boolean mfaRequired, String mfaMethod, Instant createdAt) {
        public Info(UUID id, String email, String fullName, boolean mfaRequired, Instant createdAt) {
            this(id, email, fullName, mfaRequired, null, createdAt);
        }
    }
}