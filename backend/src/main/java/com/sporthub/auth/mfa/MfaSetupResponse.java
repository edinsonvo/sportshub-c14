package com.sporthub.auth.mfa;

public record MfaSetupResponse(String secret, String otpauthUri) {}
