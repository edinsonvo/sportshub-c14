package com.sporthub.deportes;

import java.util.UUID;

public record ParticipanteResponse(
        UUID id, UUID torneoId, UUID clientId, String nombreEquipo, ParticipanteEstado estado) {

    public static ParticipanteResponse from(ParticipanteTorneo p) {
        return new ParticipanteResponse(
                p.getId(), p.getTorneoId(), p.getClientId(), p.getNombreEquipo(), p.getEstado());
    }
}
