package com.sporthub.deportes;

import java.math.BigDecimal;
import java.time.LocalTime;
import java.util.UUID;

public record InstalacionResponse(
        UUID id,
        UUID providerId,
        String nombre,
        TipoInstalacion tipo,
        int capacidad,
        BigDecimal tarifaPorHora,
        LocalTime horaApertura,
        LocalTime horaCierre,
        boolean activa) {

    public static InstalacionResponse from(Instalacion i) {
        return new InstalacionResponse(
                i.getId(),
                i.getProviderId(),
                i.getNombre(),
                i.getTipo(),
                i.getCapacidad(),
                i.getTarifaPorHora(),
                i.getHoraApertura(),
                i.getHoraCierre(),
                i.isActiva());
    }
}
