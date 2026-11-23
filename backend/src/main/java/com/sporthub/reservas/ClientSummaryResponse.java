package com.sporthub.reservas;

import com.sporthub.user.UserAccount;
import java.time.Instant;
import java.util.UUID;

/** Resumen de un cliente que ha reservado en el centro del proveedor autenticado. */
public record ClientSummaryResponse(
        UUID id, String fullName, String email, String phone, Instant createdAt) {

    public static ClientSummaryResponse from(UserAccount user) {
        return new ClientSummaryResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getPhone(),
                user.getCreatedAt());
    }
}
