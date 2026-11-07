package com.sporthub.auth;

import jakarta.validation.constraints.NotBlank;

public record MfaSendCodeRequest(@NotBlank String challengeToken) {}
