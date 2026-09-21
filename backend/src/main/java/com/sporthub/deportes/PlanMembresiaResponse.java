package com.sporthub.deportes;

import java.math.BigDecimal;
import java.util.UUID;

public record PlanMembresiaResponse(
        UUID id,
        UUID providerId,
        String nombre,
        int vigenciaDias,
        int descuentoPorcentaje,
        BigDecimal precio,
        String beneficios,
        boolean activo) {

    public static PlanMembresiaResponse from(PlanMembresia p) {
        return new PlanMembresiaResponse(
                p.getId(),
                p.getProviderId(),
                p.getNombre(),
                p.getVigenciaDias(),
                p.getDescuentoPorcentaje(),
                p.getPrecio(),
                p.getBeneficios(),
                p.isActivo());
    }
}
