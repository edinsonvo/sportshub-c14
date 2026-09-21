package com.sporthub.deportes;

import java.math.BigDecimal;
import java.util.UUID;

public record ImplementoResponse(
        UUID id, UUID providerId, String nombre, String tipo, int cantidadTotal, BigDecimal tarifa, boolean activo) {

    public static ImplementoResponse from(Implemento i) {
        return new ImplementoResponse(
                i.getId(),
                i.getProviderId(),
                i.getNombre(),
                i.getTipo(),
                i.getCantidadTotal(),
                i.getTarifa(),
                i.isActivo());
    }
}
