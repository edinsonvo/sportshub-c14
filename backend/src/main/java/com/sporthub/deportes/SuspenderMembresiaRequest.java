package com.sporthub.deportes;

import jakarta.validation.constraints.NotBlank;

public record SuspenderMembresiaRequest(@NotBlank String motivo) {}
