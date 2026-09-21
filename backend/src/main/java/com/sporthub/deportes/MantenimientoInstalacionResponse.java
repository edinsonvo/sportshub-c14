package com.sporthub.deportes;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

public record MantenimientoInstalacionResponse(
        UUID id,
        UUID instalacionId,
        LocalDate fecha,
        LocalTime horaInicio,
        LocalTime horaFin,
        String motivo,
        boolean activo) {

    public static MantenimientoInstalacionResponse from(InstalacionMantenimiento m) {
        return new MantenimientoInstalacionResponse(
                m.getId(),
                m.getInstalacionId(),
                m.getFecha(),
                m.getHoraInicio(),
                m.getHoraFin(),
                m.getMotivo(),
                m.isActivo());
    }
}
