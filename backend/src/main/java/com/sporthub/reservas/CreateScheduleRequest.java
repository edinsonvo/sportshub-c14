package com.sporthub.reservas;

import jakarta.validation.constraints.NotNull;
import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.UUID;

public record CreateScheduleRequest(
        @NotNull(message = "El personal asignado es obligatorio") UUID staffId,
        @NotNull(message = "El día de la semana es obligatorio") DayOfWeek dayOfWeek,
        @NotNull(message = "La hora de inicio es obligatoria") LocalTime startTime,
        @NotNull(message = "La hora de fin es obligatoria") LocalTime endTime) {}
