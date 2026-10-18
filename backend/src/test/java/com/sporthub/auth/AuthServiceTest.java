package com.sporthub.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.sporthub.auth.mfa.MfaMethod;
import com.sporthub.auth.mfa.MfaService;
import com.sporthub.infra.AuditLogger;
import com.sporthub.infra.BusinessException;
import com.sporthub.security.JwtService;
import com.sporthub.user.Role;
import com.sporthub.user.UserAccount;
import com.sporthub.user.UserRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;

class AuthServiceTest {

    private UserRepository userRepository;
    private PasswordEncoder passwordEncoder;
    private JwtService jwtService;
    private LoginAttemptService loginAttemptService;
    private MfaService mfaService;
    private AuditLogger auditLogger;
    private AuthService service;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        passwordEncoder = mock(PasswordEncoder.class);
        jwtService = mock(JwtService.class);
        loginAttemptService = mock(LoginAttemptService.class);
        mfaService = mock(MfaService.class);
        auditLogger = mock(AuditLogger.class);
        service = new AuthService(
                userRepository, passwordEncoder, jwtService, loginAttemptService, mfaService, auditLogger);
    }

    private UserAccount user() {
        UserAccount user = mock(UserAccount.class);
        when(user.getId()).thenReturn(UUID.randomUUID());
        when(user.getEmail()).thenReturn("user@mail.co");
        when(user.getRole()).thenReturn(Role.CLIENT);
        when(user.isActive()).thenReturn(true);
        return user;
    }

    @Test
    @DisplayName("login exitoso sin MFA emite tokens y resetea intentos")
    void loginSinMfa() {
        UserAccount user = user();
        when(user.isMfaEnabled()).thenReturn(false);
        when(userRepository.findByEmail("user@mail.co")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("pass", user.getPasswordHash())).thenReturn(true);
        when(jwtService.generateAccessToken("user@mail.co", user.getId(), "CLIENT")).thenReturn("acc");
        when(jwtService.generateRefreshToken("user@mail.co", user.getId(), "CLIENT")).thenReturn("ref");

        AuthResponse response = service.login(new LoginRequest("user@mail.co", "pass"));

        assertThat(response.accessToken()).isEqualTo("acc");
        assertThat(response.mfaRequired()).isFalse();
        verify(loginAttemptService).reset("user@mail.co");
        verify(mfaService, never()).beginChallenge(any());
    }

    @Test
    @DisplayName("login con contraseña incorrecta lanza CREDENCIALES_INVALIDAS y registra el intento")
    void loginPasswordIncorrecta() {
        UserAccount user = user();
        when(userRepository.findByEmail("user@mail.co")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("bad", user.getPasswordHash())).thenReturn(false);

        assertThatThrownBy(() -> service.login(new LoginRequest("user@mail.co", "bad")))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Correo o contraseña incorrectos");
        verify(loginAttemptService).registerFailure("user@mail.co");
    }

    @Test
    @DisplayName("login devuelve segundo paso cuando el usuario tiene MFA activado")
    void loginConMfa() {
        UserAccount user = user();
        when(user.isMfaEnabled()).thenReturn(true);
        when(userRepository.findByEmail("user@mail.co")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("pass", user.getPasswordHash())).thenReturn(true);
        UUID id = user.getId();
        AuthResponse pending =
                AuthResponse.pending(id, "user@mail.co", "CLIENT", List.of(MfaMethod.TOTP), "ch");
        when(mfaService.beginChallenge(user)).thenReturn(pending);

        AuthResponse response = service.login(new LoginRequest("user@mail.co", "pass"));

        assertThat(response.mfaRequired()).isTrue();
        assertThat(response.challengeToken()).isEqualTo("ch");
        assertThat(response.accessToken()).isNull();
        verify(loginAttemptService).reset("user@mail.co");
    }

    @Test
    @DisplayName("registro crea el usuario y emite tokens")
    void registro() {
        when(userRepository.existsByEmail("nuevo@mail.co")).thenReturn(false);
        when(passwordEncoder.encode("Passw0rd1")).thenReturn("hash");
        when(jwtService.generateAccessToken("nuevo@mail.co", null, "CLIENT")).thenReturn("acc");
        when(jwtService.generateRefreshToken("nuevo@mail.co", null, "CLIENT")).thenReturn("ref");

        AuthResponse response = service.register(new RegisterRequest("nuevo@mail.co", "Passw0rd1", "Nombre", "300", null));

        assertThat(response.email()).isEqualTo("nuevo@mail.co");
        assertThat(response.role()).isEqualTo("CLIENT");
        assertThat(response.accessToken()).isEqualTo("acc");
    }

    @Test
    @DisplayName("registro con email en uso lanza conflicto")
    void registroEmailEnUso() {
        when(userRepository.existsByEmail("nuevo@mail.co")).thenReturn(true);
        assertThatThrownBy(() -> service.register(new RegisterRequest("nuevo@mail.co", "Passw0rd1", "Nombre", null, null)))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("ya está registrado");
    }

    @Test
    @DisplayName("cambio de contraseña valida la actual")
    void cambioPassword() {
        UserAccount user = user();
        when(userRepository.findByEmail("user@mail.co")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("old", user.getPasswordHash())).thenReturn(true);
        when(passwordEncoder.encode("Nueva1Pass")).thenReturn("newhash");

        service.changePassword("user@mail.co", "old", "Nueva1Pass");

        verify(user).setPasswordHash("newhash");
        verify(auditLogger).record(any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("cambio de contraseña con contraseña actual incorrecta")
    void cambioPasswordIncorrecta() {
        UserAccount user = user();
        when(userRepository.findByEmail("user@mail.co")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("bad", user.getPasswordHash())).thenReturn(false);

        assertThatThrownBy(() -> service.changePassword("user@mail.co", "bad", "Nueva1Pass"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("La contraseña actual no es correcta");
    }
}