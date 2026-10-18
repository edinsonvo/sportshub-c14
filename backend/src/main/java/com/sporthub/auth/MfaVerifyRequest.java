package com.sporthub.auth;

import com.sporthub.auth.mfa.MfaMethod;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record MfaVerifyRequest(@NotBlank String challengeToken, @NotNull MfaMethod method, @NotBlank String code) {}