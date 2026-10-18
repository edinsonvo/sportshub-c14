package com.sporthub.auth.mfa;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.sporthub.auth.AuthResponse;
import com.sporthub.infra.AuditLogger;
import com.sporthub.infra.BusinessException;
import com.sporthub.security.JwtService;
import com.sporthub.user.Role;
import com.sporthub.user.UserAccount;
import com.sporthub.user.UserRepository;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

class MfaServiceTest {

    private JwtService jwtService;
    private UserRepository userRepository;
    private MfaOtpService otpService;
    private MfaCodeSender codeSender;
    private PasswordEncoder passwordEncoder;
    private AuditLogger auditLogger;
    private MfaService service;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService(
                "0123456789abcdef0123456789abcdef0123456789", 900_000L, 2_592_000_000L, 300_000L);
        userRepository = mock(UserRepository.class);
        otpService = mock(MfaOtpService.class);
        codeSender = mock(MfaCodeSender.class);
        passwordEncoder = mock(PasswordEncoder.class);
        auditLogger = mock(AuditLogger.class);
        service = new MfaService(
                userRepository, jwtService, otpService, codeSender, passwordEncoder, auditLogger);
        ReflectionTestUtils.setField(service, "otpTtlSeconds", 300L);
        ReflectionTestUtils.setField(service, "totpIssuer", "SportHub");
    }

    private UserAccount user(String email, String secret) {
        UserAccount user = mock(UserAccount.class);
        when(user.getId()).thenReturn(UUID.randomUUID());
        when(user.getEmail()).thenReturn(email);
        when(user.getRole()).thenReturn(Role.CLIENT);
        when(user.getMfaSecret()).thenReturn(secret);
        when(user.isMfaEnabled()).thenReturn(true);
        when(user.getMfaMethod()).thenReturn(MfaMethod.TOTP);
        when(user.isActive()).thenReturn(true);
        return user;
    }

    @Test
    @DisplayName("setup genera secreto y URI otpauth, y lo persiste en el usuario")
    void setup() {
        UserAccount user = user("a@b.co", null);
        MfaSetupResponse setup = service.setup(user);
        assertThat(setup.secret()).isNotBlank();
        assertThat(setup.otpauthUri()).contains(setup.secret());
        verify(user).setMfaSecret(setup.secret());
    }

    @Test
    @DisplayName("habilita TOTP cuando el código es correcto")
    void habilitaTotp() {
        UserAccount user = user("a@b.co", null);
        String secret = Totp.generateSecret();
        when(user.getMfaSecret()).thenReturn(secret);
        service.enable(user, MfaMethod.TOTP, Totp.generateCode(secret));
        verify(user).enableMfa(MfaMethod.TOTP);
    }

    @Test
    @DisplayName("rechaza habilitar TOTP con código incorrecto")
    void habilitaTotpCodigoIncorrecto() {
        UserAccount user = user("a@b.co", Totp.generateSecret());
        assertThatThrownBy(() -> service.enable(user, MfaMethod.TOTP, "000000"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("El código no es válido");
        verify(user, never()).enableMfa(any());
    }

    @Test
    @DisplayName("rechaza habilitar TOTP sin haber generado el secreto")
    void habilitaTotpSinSecreto() {
        UserAccount user = user("a@b.co", null);
        assertThatThrownBy(() -> service.enable(user, MfaMethod.TOTP, "123456"))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getErrorCode())
                .isEqualTo("MFA_NO_SECRET");
    }

    @Test
    @DisplayName("habilita EMAIL cuando el OTP enviado es correcto")
    void habilitaEmail() {
        UserAccount user = user("a@b.co", null);
        when(otpService.verify(user, "123456")).thenReturn(true);
        service.enable(user, MfaMethod.EMAIL, "123456");
        verify(user).setMfaSecret(null);
        verify(user).enableMfa(MfaMethod.EMAIL);
    }

    @Test
    @DisplayName("verifica el desafío TOTP y emite tokens")
    void verificaDesafioTotp() {
        UserAccount user = user("a@b.co", null);
        String secret = Totp.generateSecret();
        when(user.getMfaSecret()).thenReturn(secret);
        when(userRepository.findByEmail("a@b.co")).thenReturn(Optional.of(user));
        String challenge = jwtService.generateMfaChallenge("a@b.co", user.getId(), "CLIENT");
        AuthResponse response = service.verifyChallenge(challenge, MfaMethod.TOTP, Totp.generateCode(secret));
        assertThat(response.mfaRequired()).isFalse();
        assertThat(response.accessToken()).isNotBlank();
        assertThat(response.refreshToken()).isNotBlank();
    }

    @Test
    @DisplayName("rechaza el desafío con código incorrecto")
    void verificaDesafioCodigoIncorrecto() {
        UserAccount user = user("a@b.co", Totp.generateSecret());
        when(userRepository.findByEmail("a@b.co")).thenReturn(Optional.of(user));
        String challenge = jwtService.generateMfaChallenge("a@b.co", user.getId(), "CLIENT");
        assertThatThrownBy(() -> service.verifyChallenge(challenge, MfaMethod.TOTP, "000000"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("El código de verificación no es válido");
    }

    @Test
    @DisplayName("rechaza un token que no es de tipo MFA")
    void rechazaTokenNoMfa() {
        UserAccount user = user("a@b.co", Totp.generateSecret());
        String access = jwtService.generateAccessToken("a@b.co", user.getId(), "CLIENT");
        assertThatThrownBy(() -> service.verifyChallenge(access, MfaMethod.TOTP, "123456"))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getErrorCode())
                .isEqualTo("CHALLENGE_INVALIDO");
    }

    @Test
    @DisplayName("envía el OTP por correo para habilitar")
    void enviaCodigoEmail() {
        UserAccount user = user("a@b.co", null);
        when(otpService.generate(user)).thenReturn("123456");
        MfaSendCodeResponse response = service.sendEmailCode(user);
        verify(codeSender).send("a@b.co", "123456");
        assertThat(response.expiresInSeconds()).isEqualTo(300);
    }

    @Test
    @DisplayName("envía el OTP por correo durante el login propio de EMAIL")
    void enviaCodigoLoginEmail() {
        UserAccount user = user("a@b.co", null);
        when(user.getMfaMethod()).thenReturn(MfaMethod.EMAIL);
        when(userRepository.findByEmail("a@b.co")).thenReturn(Optional.of(user));
        when(otpService.generate(user)).thenReturn("654321");
        String challenge = jwtService.generateMfaChallenge("a@b.co", user.getId(), "CLIENT");
        service.sendLoginEmailCode(challenge);
        verify(codeSender).send("a@b.co", "654321");
    }

    @Test
    @DisplayName("rechaza solicitar OTP del login si el usuario no tiene EMAIL activado")
    void enviaCodigoLoginEmailNoActivo() {
        UserAccount user = user("a@b.co", null);
        when(user.isMfaEnabled()).thenReturn(false);
        when(userRepository.findByEmail("a@b.co")).thenReturn(Optional.of(user));
        String challenge = jwtService.generateMfaChallenge("a@b.co", user.getId(), "CLIENT");
        assertThatThrownBy(() -> service.sendLoginEmailCode(challenge))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getErrorCode())
                .isEqualTo("MFA_NO_ACTIVADA");
    }

    @Test
    @DisplayName("desactiva el MFA con la contraseña correcta")
    void desactiva() {
        UserAccount user = user("a@b.co", Totp.generateSecret());
        when(passwordEncoder.matches("pass", user.getPasswordHash())).thenReturn(true);
        service.disable(user, "pass");
        verify(user).disableMfa();
        verify(otpService).clear(user.getId().toString());
    }

    @Test
    @DisplayName("rechaza desactivar con contraseña incorrecta")
    void desactivaPasswordIncorrecta() {
        UserAccount user = user("a@b.co", Totp.generateSecret());
        when(passwordEncoder.matches("bad", user.getPasswordHash())).thenReturn(false);
        assertThatThrownBy(() -> service.disable(user, "bad"))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getErrorCode())
                .isEqualTo("PASSWORD_INCORRECTA");
    }

    @Test
    @DisplayName("beginChallenge devuelve una respuesta de segundo paso")
    void beginChallenge() {
        UserAccount user = user("a@b.co", Totp.generateSecret());
        AuthResponse response = service.beginChallenge(user);
        assertThat(response.mfaRequired()).isTrue();
        assertThat(response.challengeToken()).isNotBlank();
        assertThat(response.accessToken()).isNull();
        assertThat(response.mfaMethods()).containsExactly(MfaMethod.TOTP, MfaMethod.EMAIL);
    }
}