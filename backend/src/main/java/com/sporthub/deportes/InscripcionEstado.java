package com.sporthub.deportes;

import java.util.Set;

public enum InscripcionEstado {
    CONFIRMADA,
    EN_ESPERA,
    CANCELADA,
    COMPLETADA;

    public static final Set<InscripcionEstado> ACTIVAS = Set.of(CONFIRMADA, EN_ESPERA);
}
