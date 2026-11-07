package com.sporthub.admin;

import com.sporthub.reservas.Provider;
import java.time.Instant;
import java.util.UUID;

public record AdminProviderResponse(
        UUID id,
        UUID userId,
        String userEmail,
        String userFullName,
        String businessName,
        String documentNumber,
        boolean identityVerified,
        Instant verifiedAt,
        String logoUrl,
        boolean active,
        long staffCount,
        long servicesCount) {

    public static AdminProviderResponse of(
            Provider provider, String userEmail, String userFullName, long staffCount, long servicesCount) {
        return new AdminProviderResponse(
                provider.getId(),
                provider.getUserId(),
                userEmail,
                userFullName,
                provider.getBusinessName(),
                provider.getDocumentNumber(),
                provider.isIdentityVerified(),
                provider.isIdentityVerified() ? Instant.now() : null,
                provider.getLogoUrl(),
                provider.isActive(),
                staffCount,
                servicesCount);
    }
}
