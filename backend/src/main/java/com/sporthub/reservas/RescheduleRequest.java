package com.sporthub.reservas;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.LocalTime;

public record RescheduleRequest(@NotNull LocalDate newDate, @NotNull LocalTime newStartTime) {}
