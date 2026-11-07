package com.sporthub.reservas;

import jakarta.validation.constraints.NotBlank;

public record UpdateProviderProfileRequest(
        @NotBlank(message = "La razón social o nombre comercial es obligatorio") String businessName,
        String documentNumber,
        String logoUrl) {}
