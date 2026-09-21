package com.sporthub.deportes;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.LocalTime;

public record BloquearInstalacionRequest(
        @NotNull LocalDate fecha, @NotNull LocalTime horaInicio, @NotNull LocalTime horaFin, String motivo) {}
