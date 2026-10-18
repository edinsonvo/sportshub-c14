package com.sporthub.auth.mfa;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.mail.MailSender;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.stereotype.Component;

/**
 * Envío real del OTP por correo. Se activa con {@code sporthub.mfa.email.enabled=true}
 * (requiere propiedades {@code spring.mail.*}).
 */
@Component
@ConditionalOnProperty(name = "sporthub.mfa.email.enabled", havingValue = "true")
@ConditionalOnClass(MailSender.class)
public class EmailMfaCodeSender implements MfaCodeSender {

    private final MailSender mailSender;

    @Value("${sporthub.mfa.email.sender:no-reply@sporthub.local}")
    private String sender;

    public EmailMfaCodeSender(MailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Override
    public void send(String email, String code) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(sender);
        message.setTo(email);
        message.setSubject("Código de verificación SportHub");
        message.setText("Tu código de verificación es: " + code);
        mailSender.send(message);
    }
}