package com.sporthub.deportes;

import java.util.Set;

public enum ReservaImplementoEstado {
    RESERVADA,
    PRESTADO,
    DEVUELTO,
    CANCELADO;

    public static final Set<ReservaImplementoEstado> EN_USO = Set.of(RESERVADA, PRESTADO);
}
