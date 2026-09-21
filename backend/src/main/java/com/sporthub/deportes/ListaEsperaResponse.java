package com.sporthub.deportes;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

public record ListaEsperaResponse(
        UUID id, UUID instalacionId, UUID clientId, LocalDate fecha, LocalTime horaInicio, ListaEsperaEstado estado) {

    public static ListaEsperaResponse from(ListaEsperaInstalacion l) {
        return new ListaEsperaResponse(
                l.getId(), l.getInstalacionId(), l.getClientId(), l.getFecha(), l.getHoraInicio(), l.getEstado());
    }
}
