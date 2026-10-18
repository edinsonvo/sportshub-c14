package com.sporthub.deportes;

import java.time.LocalDate;
import java.util.UUID;

public record MembresiaGestionResponse(
        UUID id,
        UUID clientId,
        String clientNombre,
        UUID planId,
        String planNombre,
        LocalDate fechaInicio,
        LocalDate fechaFin,
        MembresiaEstado estado,
        String motivo) {}