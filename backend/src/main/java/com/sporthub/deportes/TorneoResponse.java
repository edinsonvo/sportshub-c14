package com.sporthub.deportes;

import java.time.LocalDate;
import java.util.UUID;

public record TorneoResponse(
        UUID id,
        UUID providerId,
        String nombre,
        String categoria,
        FormatoTorneo formato,
        LocalDate fechaInicio,
        LocalDate fechaFin,
        int cupo,
        TorneoEstado estado) {

    public static TorneoResponse from(Torneo t) {
        return new TorneoResponse(
                t.getId(),
                t.getProviderId(),
                t.getNombre(),
                t.getCategoria(),
                t.getFormato(),
                t.getFechaInicio(),
                t.getFechaFin(),
                t.getCupo(),
                t.getEstado());
    }
}
