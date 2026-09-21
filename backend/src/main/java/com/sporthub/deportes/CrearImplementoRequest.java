package com.sporthub.deportes;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record CrearImplementoRequest(
        @NotBlank String nombre,
        @NotBlank String tipo,
        @Min(1) int cantidadTotal,
        @NotNull @DecimalMin("0") BigDecimal tarifa) {}
