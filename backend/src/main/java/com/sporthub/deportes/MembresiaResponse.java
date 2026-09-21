package com.sporthub.deportes;

import java.time.LocalDate;
import java.util.UUID;

public record MembresiaResponse(
        UUID id,
        UUID planId,
        String planNombre,
        UUID clientId,
        LocalDate fechaInicio,
        LocalDate fechaFin,
        MembresiaEstado estado,
        String motivo) {

    public static MembresiaResponse from(Membresia m, String planNombre) {
        return new MembresiaResponse(
                m.getId(),
                m.getPlanId(),
                planNombre,
                m.getClientId(),
                m.getFechaInicio(),
                m.getFechaFin(),
                m.getEstado(),
                m.getMotivo());
    }
}
