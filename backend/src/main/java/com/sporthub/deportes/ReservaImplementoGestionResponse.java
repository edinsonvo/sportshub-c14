package com.sporthub.deportes;

import java.time.LocalDate;
import java.util.UUID;

public record ReservaImplementoGestionResponse(
        UUID id,
        UUID implementoId,
        String implementoNombre,
        UUID clientId,
        String clientNombre,
        LocalDate fecha,
        int cantidad,
        ReservaImplementoEstado estado,
        CondicionImplemento condicion) {}
