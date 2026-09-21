package com.sporthub.reservas;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

public record CreateAppointmentRequest(
        @NotNull UUID serviceId, @NotNull UUID staffId, @NotNull LocalDate date, @NotNull LocalTime startTime) {}
