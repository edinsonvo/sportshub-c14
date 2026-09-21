package com.sporthub.deportes;

import java.util.UUID;

public record InscripcionClaseResponse(UUID id, UUID claseGrupalId, UUID clientId, InscripcionEstado estado) {

    public static InscripcionClaseResponse from(InscripcionClase i) {
        return new InscripcionClaseResponse(i.getId(), i.getClaseGrupalId(), i.getClientId(), i.getEstado());
    }
}
