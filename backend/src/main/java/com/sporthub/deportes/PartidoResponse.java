package com.sporthub.deportes;

import java.time.LocalDate;
import java.util.UUID;

public record PartidoResponse(
        UUID id,
        UUID torneoId,
        int ronda,
        UUID participanteAId,
        UUID participanteBId,
        LocalDate fecha,
        Integer marcadorA,
        Integer marcadorB,
        UUID ganadorId,
        PartidoEstado estado) {

    public static PartidoResponse from(PartidoTorneo p) {
        return new PartidoResponse(
                p.getId(),
                p.getTorneoId(),
                p.getRonda(),
                p.getParticipanteAId(),
                p.getParticipanteBId(),
                p.getFecha(),
                p.getMarcadorA(),
                p.getMarcadorB(),
                p.getGanadorId(),
                p.getEstado());
    }
}
