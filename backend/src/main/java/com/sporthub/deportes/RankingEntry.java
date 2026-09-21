package com.sporthub.deportes;

import java.util.UUID;

public record RankingEntry(UUID participanteId, String nombre, int jugados, int ganados, int puntos) {}
