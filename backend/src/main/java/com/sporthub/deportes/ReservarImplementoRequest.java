package com.sporthub.deportes;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record ReservarImplementoRequest(@NotNull LocalDate fecha, @Min(1) int cantidad) {}
