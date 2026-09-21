package com.sporthub.deportes;

import jakarta.validation.constraints.Min;

public record RegistrarResultadoRequest(@Min(0) int marcadorA, @Min(0) int marcadorB) {}
