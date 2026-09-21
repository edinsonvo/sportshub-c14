package com.sporthub.deportes;

import java.util.Set;

public enum ReservaInstalacionEstado {
    RESERVADA,
    CANCELADA,
    COMPLETADA;

    public static final Set<ReservaInstalacionEstado> ACTIVAS = Set.of(RESERVADA);
}
