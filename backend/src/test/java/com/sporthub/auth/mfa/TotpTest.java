package com.sporthub.auth.mfa;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class TotpTest {

    @Test
    @DisplayName("el secreto generado es Base32 y descodifica a 160 bits")
    void secretoGenerado() {
        String secret = Totp.generateSecret();
        assertThat(Totp.decodeBase32(secret)).hasSize(20);
        assertThat(secret).doesNotContain("0", "1", "8", "9");
    }

    @Test
    @DisplayName("genera y verifica un código TOTP válido")
    void generaYVerifica() {
        String secret = Totp.generateSecret();
        String code = Totp.generateCode(secret);
        assertThat(code).matches("\\d{6}");
        assertThat(Totp.verify(secret, code)).isTrue();
    }

    @Test
    @DisplayName("rechaza un código incorrecto")
    void rechazaCodigoIncorrecto() {
        String secret = Totp.generateSecret();
        Totp.generateCode(secret);
        assertThat(Totp.verify(secret, "000000")).isFalse();
    }

    @Test
    @DisplayName("rechaza códigos con formato inválido y secretos nulos")
    void validaFormato() {
        String secret = Totp.generateSecret();
        assertThat(Totp.verify(secret, "12345")).isFalse();
        assertThat(Totp.verify(secret, "abcdef")).isFalse();
        assertThat(Totp.verify(secret, null)).isFalse();
        assertThat(Totp.verify(null, "123456")).isFalse();
    }

    @Test
    @DisplayName("genera una URI otpauth con los parámetros de SportHub")
    void generaUriOtpauth() {
        String secret = Totp.generateSecret();
        String uri = Totp.otpauthUri("SportHub", "a@b.co", secret);
        assertThat(uri).startsWith("otpauth://totp/");
        assertThat(uri)
                .contains("secret=" + secret)
                .contains("issuer=SportHub")
                .contains("period=30")
                .contains("digits=6");
    }

    @Test
    @DisplayName("codifica y descodifica Base32 en ambos sentidos")
    void base32RoundTrip() {
        byte[] bytes = "sporthub".getBytes(StandardCharsets.UTF_8);
        String encoded = Totp.base32Encode(bytes);
        assertThat(Arrays.equals(Totp.decodeBase32(encoded), bytes)).isTrue();
    }
}
