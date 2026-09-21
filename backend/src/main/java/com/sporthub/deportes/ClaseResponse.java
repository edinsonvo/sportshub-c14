package com.sporthub.deportes;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

public record ClaseResponse(
        UUID id,
        UUID providerId,
        UUID instalacionId,
        UUID entrenadorStaffId,
        String nombre,
        String nivel,
        LocalDate fecha,
        LocalTime hora,
        int duracionMin,
        int cupo,
        int inscritos,
        boolean activa) {

    public static ClaseResponse from(ClaseGrupal c, int inscritos) {
        return new ClaseResponse(
                c.getId(),
                c.getProviderId(),
                c.getInstalacionId(),
                c.getEntrenadorStaffId(),
                c.getNombre(),
                c.getNivel(),
                c.getFecha(),
                c.getHora(),
                c.getDuracionMin(),
                c.getCupo(),
                inscritos,
                c.isActiva());
    }
}
