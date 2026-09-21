package com.sporthub.deportes;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.LocalTime;

public record SolicitarListaEsperaRequest(@NotNull LocalDate fecha, @NotNull LocalTime horaInicio) {}
