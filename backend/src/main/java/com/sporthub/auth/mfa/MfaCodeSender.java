package com.sporthub.auth.mfa;

/**
 * Entrega de códigos OTP por correo. En desarrollo (sin SMTP) se activa la
 * implementación de log; con {@code sporthub.mfa.email.enabled=true} se envía correo real.
 */
public interface MfaCodeSender {
    void send(String email, String code);
}
