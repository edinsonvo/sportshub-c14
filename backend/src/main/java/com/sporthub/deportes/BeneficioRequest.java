package com.sporthub.deportes;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record BeneficioRequest(@NotNull @DecimalMin("0") BigDecimal tarifa) {}
