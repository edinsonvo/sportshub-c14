package com.sporthub.reservas;

public enum AppointmentStatus {
    SOLICITADA,
    CONFIRMADA,
    COMPLETADA,
    REPROGRAMADA,
    CANCELADA,
    CANCELADA_POR_IMPREVISTO;

    public static final java.util.Set<AppointmentStatus> ACTIVAS =
            java.util.Set.of(SOLICITADA, CONFIRMADA, REPROGRAMADA);
}
