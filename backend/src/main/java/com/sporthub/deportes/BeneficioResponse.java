package com.sporthub.deportes;

import java.math.BigDecimal;

public record BeneficioResponse(BigDecimal tarifaOriginal, BigDecimal tarifaFinal, int descuentoPorcentaje) {}
