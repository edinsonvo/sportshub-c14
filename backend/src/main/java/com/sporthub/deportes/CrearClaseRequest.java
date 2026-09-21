package com.sporthub.deportes;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

public record CrearClaseRequest(
        @NotBlank String nombre,
        @NotBlank String nivel,
        @NotNull UUID instalacionId,
        @NotNull UUID entrenadorStaffId,
        @NotNull LocalDate fecha,
        @NotNull LocalTime hora,
        @Min(15) int duracionMin,
        @Min(1) int cupo) {}
