package com.sporthub.deportes;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.LocalTime;

public record ReservarInstalacionRequest(@NotNull LocalDate fecha, @NotNull LocalTime horaInicio) {}
