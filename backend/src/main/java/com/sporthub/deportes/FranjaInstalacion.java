package com.sporthub.deportes;

import java.time.LocalTime;

public record FranjaInstalacion(LocalTime inicio, LocalTime fin, int disponibles) {}
