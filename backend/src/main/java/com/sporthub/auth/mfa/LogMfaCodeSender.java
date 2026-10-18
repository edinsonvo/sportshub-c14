package com.sporthub.auth.mfa;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/**
 * Entrega de códigos en modo desarrollo: imprime el OTP en el log del backend
 * (útil sin SMTP configurado). Activada cuando el correo real está desactivado.
 */
@Component
@ConditionalOnProperty(name = "sporthub.mfa.email.enabled", havingValue = "false", matchIfMissing = true)
public class LogMfaCodeSender implements MfaCodeSender {

    private static final Logger log = LoggerFactory.getLogger(LogMfaCodeSender.class);

    @Override
    public void send(String email, String code) {
        log.warn("[MFA][DEV] Código de verificación para {}: {}", email, code);
    }
}