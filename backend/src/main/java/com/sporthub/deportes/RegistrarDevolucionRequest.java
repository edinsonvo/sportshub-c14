package com.sporthub.deportes;

import jakarta.validation.constraints.NotNull;

public record RegistrarDevolucionRequest(@NotNull CondicionImplemento condicion) {}
