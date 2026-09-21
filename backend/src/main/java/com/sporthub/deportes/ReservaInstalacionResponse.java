package com.sporthub.deportes;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

public record ReservaInstalacionResponse(
        UUID id,
        UUID instalacionId,
        UUID clientId,
        LocalDate fecha,
        LocalTime horaInicio,
        LocalTime horaFin,
        ReservaInstalacionEstado estado) {

    public static ReservaInstalacionResponse from(ReservaInstalacion r) {
        return new ReservaInstalacionResponse(
                r.getId(),
                r.getInstalacionId(),
                r.getClientId(),
                r.getFecha(),
                r.getHoraInicio(),
                r.getHoraFin(),
                r.getEstado());
    }
}
