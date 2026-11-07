package com.sporthub.reservas;

import java.time.Instant;
import java.util.UUID;

public record ProviderProfileResponse(
        UUID id,
        UUID userId,
        String businessName,
        String documentNumber,
        boolean identityVerified,
        Instant verifiedAt,
        String logoUrl,
        boolean active) {

    public static ProviderProfileResponse from(Provider p) {
        return new ProviderProfileResponse(
                p.getId(),
                p.getUserId(),
                p.getBusinessName(),
                p.getDocumentNumber(),
                p.isIdentityVerified(),
                p.isIdentityVerified() ? Instant.now() : null,
                p.getLogoUrl(),
                p.isActive());
    }
}
