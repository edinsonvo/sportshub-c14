package com.sporthub.deportes;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record ComprarMembresiaRequest(@NotNull UUID planId) {}
