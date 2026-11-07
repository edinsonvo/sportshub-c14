package com.sporthub.reservas;

import com.sporthub.user.UserAccount;
import java.util.UUID;

public record StaffMemberResponse(
        UUID id,
        UUID providerId,
        UUID userId,
        String email,
        String fullName,
        String phone,
        String position,
        boolean active) {

    public static StaffMemberResponse of(ProviderStaff staff, UserAccount user) {
        return new StaffMemberResponse(
                staff.getId(),
                staff.getProviderId(),
                staff.getUserId(),
                user != null ? user.getEmail() : "",
                user != null ? user.getFullName() : "",
                user != null ? user.getPhone() : "",
                staff.getPosition(),
                staff.isActive());
    }
}
