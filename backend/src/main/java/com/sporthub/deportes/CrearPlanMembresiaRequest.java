package com.sporthub.deportes;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record CrearPlanMembresiaRequest(
        @NotBlank String nombre,
        @Min(1) int vigenciaDias,
        @Min(0) @Max(100) int descuentoPorcentaje,
        @NotNull @DecimalMin("0") BigDecimal precio,
        String beneficios) {}
