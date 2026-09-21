package com.sporthub.deportes;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalTime;

public record CrearInstalacionRequest(
        @NotBlank String nombre,
        @NotNull TipoInstalacion tipo,
        @Min(1) int capacidad,
        @NotNull @DecimalMin("0") BigDecimal tarifaPorHora,
        @NotNull LocalTime horaApertura,
        @NotNull LocalTime horaCierre) {}
