package com.sporthub.deportes;

import java.time.LocalDate;
import java.util.UUID;

public record ReservaImplementoResponse(
        UUID id,
        UUID implementoId,
        UUID clientId,
        LocalDate fecha,
        int cantidad,
        ReservaImplementoEstado estado,
        CondicionImplemento condicion) {

    public static ReservaImplementoResponse from(ReservaImplemento r) {
        return new ReservaImplementoResponse(
                r.getId(),
                r.getImplementoId(),
                r.getClientId(),
                r.getFecha(),
                r.getCantidad(),
                r.getEstado(),
                r.getCondicion());
    }
}
