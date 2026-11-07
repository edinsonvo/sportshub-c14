package com.sporthub.reservas;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record CreateStaffRequest(
        @NotBlank(message = "El correo es obligatorio") @Email(message = "Correo no válido") String email,
        @NotBlank(message = "El nombre completo es obligatorio") String fullName,
        String phone,
        @NotBlank(message = "El cargo o posición es obligatorio") String position,
        String password) {}
