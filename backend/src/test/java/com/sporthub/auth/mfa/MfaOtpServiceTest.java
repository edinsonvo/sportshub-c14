package com.sporthub.auth.mfa;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.sporthub.user.UserAccount;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

class MfaOtpServiceTest {

    private MfaOtpService service;

    @BeforeEach
    void setUp() {
        service = new MfaOtpService();
        ReflectionTestUtils.setField(service, "ttlSeconds", 300L);
    }

    private UserAccount user() {
        UserAccount user = mock(UserAccount.class);
        when(user.getId()).thenReturn(UUID.randomUUID());
        return user;
    }

    @Test
    @DisplayName("genera un código de 6 dígitos y lo verifica")
    void generaYVerifica() {
        UserAccount user = user();
        String code = service.generate(user);
        assertThat(code).matches("\\d{6}");
        assertThat(service.verify(user, code)).isTrue();
    }

    @Test
    @DisplayName("rechaza un código incorrecto")
    void rechazaCodigoIncorrecto() {
        UserAccount user = user();
        service.generate(user);
        assertThat(service.verify(user, "000000")).isFalse();
    }

    @Test
    @DisplayName("el código es de un solo uso")
    void esDeUnSoloUso() {
        UserAccount user = user();
        String code = service.generate(user);
        assertThat(service.verify(user, code)).isTrue();
        assertThat(service.verify(user, code)).isFalse();
    }

    @Test
    @DisplayName("el código expira al cumplirse el TTL")
    void expira() {
        UserAccount user = user();
        ReflectionTestUtils.setField(service, "ttlSeconds", 0L);
        service.generate(user);
        assertThat(service.verify(user, "123456")).isFalse();
    }

    @Test
    @DisplayName("clear elimina el OTP pendiente")
    void limpia() {
        UserAccount user = user();
        service.generate(user);
        service.clear(user.getId().toString());
        assertThat(service.verify(user, "123456")).isFalse();
    }
}
