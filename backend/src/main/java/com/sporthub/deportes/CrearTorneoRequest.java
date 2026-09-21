package com.sporthub.deportes;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record CrearTorneoRequest(
        @NotBlank String nombre,
        @NotBlank String categoria,
        @NotNull FormatoTorneo formato,
        @NotNull LocalDate fechaInicio,
        @NotNull LocalDate fechaFin,
        @Min(2) int cupo) {}
