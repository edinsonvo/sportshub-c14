package com.sporthub.user;

import java.time.Instant;
import java.util.UUID;

public record UserProfileResponse(
        UUID id,
        String email,
        String fullName,
        String phone,
        Role role,
        boolean active,
        boolean mfaEnabled,
        Instant createdAt) {

    public static UserProfileResponse from(UserAccount user) {
        return new UserProfileResponse(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getPhone(),
                user.getRole(),
                user.isActive(),
                user.isMfaEnabled(),
                user.getCreatedAt());
    }
}
