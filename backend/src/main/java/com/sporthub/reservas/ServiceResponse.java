package com.sporthub.reservas;

import java.math.BigDecimal;
import java.util.UUID;

public record ServiceResponse(
        UUID id,
        UUID providerId,
        String name,
        String description,
        int durationMinutes,
        BigDecimal price,
        boolean active,
        String imageUrl) {

    public static ServiceResponse from(ProviderService s) {
        return new ServiceResponse(
                s.getId(),
                s.getProviderId(),
                s.getName(),
                s.getDescription(),
                s.getDurationMinutes(),
                s.getPrice(),
                s.isActive(),
                s.getImageUrl());
    }
}
