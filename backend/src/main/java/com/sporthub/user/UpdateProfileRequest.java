package com.sporthub.user;

import jakarta.validation.constraints.NotBlank;

public record UpdateProfileRequest(
        @NotBlank(message = "El nombre completo es obligatorio") String fullName, String phone) {}
