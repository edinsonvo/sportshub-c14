package com.sporthub.auth;

import jakarta.validation.constraints.NotBlank;

public record DisableMfaRequest(@NotBlank String password) {}
