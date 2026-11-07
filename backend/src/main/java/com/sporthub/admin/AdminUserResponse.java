package com.sporthub.admin;

import com.sporthub.user.Role;
import com.sporthub.user.UserAccount;
import java.time.Instant;
import java.util.UUID;

public record AdminUserResponse(
        UUID id,
        String email,
        String fullName,
        String phone,
        Role role,
        boolean active,
        boolean mfaEnabled,
        Instant createdAt) {

    public static AdminUserResponse from(UserAccount user) {
        return new AdminUserResponse(
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
