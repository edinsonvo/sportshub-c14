package com.sporthub.reservas;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record UpdateServiceRequest(
        @NotBlank(message = "El nombre del servicio es obligatorio") String name,
        String description,
        @Min(value = 5, message = "La duración mínima es de 5 minutos") int durationMinutes,
        @NotNull(message = "El precio es obligatorio") @DecimalMin(value = "0.0", inclusive = true, message = "El precio no puede ser negativo")
                BigDecimal price,
        Boolean active,
        String imageUrl) {}
