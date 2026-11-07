package com.sporthub.auth;

import com.sporthub.auth.mfa.MfaService;
import com.sporthub.infra.AuditLogger;
import com.sporthub.infra.BusinessException;
import com.sporthub.reservas.Provider;
import com.sporthub.reservas.ProviderRepository;
import com.sporthub.security.JwtService;
import com.sporthub.user.Role;
import com.sporthub.user.UserAccount;
import com.sporthub.user.UserRepository;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final ProviderRepository providerRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final LoginAttemptService loginAttemptService;
    private final MfaService mfaService;
    private final AuditLogger auditLogger;

    public AuthService(
            UserRepository userRepository,
            ProviderRepository providerRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            LoginAttemptService loginAttemptService,
            MfaService mfaService,
            AuditLogger auditLogger) {
        this.userRepository = userRepository;
        this.providerRepository = providerRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.loginAttemptService = loginAttemptService;
        this.mfaService = mfaService;
        this.auditLogger = auditLogger;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new BusinessException("EMAIL_EN_USO", "El correo ya está registrado", HttpStatus.CONFLICT);
        }
        Role role = parseRole(request.role());
        UserAccount user = new UserAccount(
                request.email(), passwordEncoder.encode(request.password()), request.fullName(), request.phone(), role);
        userRepository.save(user);

        if (role == Role.PROVIDER) {
            Provider provider = new Provider(user.getId(), user.getFullName(), "PENDIENTE");
            providerRepository.save(provider);
        }

        return issueTokens(user);
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        loginAttemptService.checkBlocked(request.email());
        UserAccount user = userRepository
                .findByEmail(request.email())
                .filter(UserAccount::isActive)
                .orElseThrow(() -> new BusinessException(
                        "CREDENCIALES_INVALIDAS", "Correo o contraseña incorrectos", HttpStatus.UNAUTHORIZED));
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            loginAttemptService.registerFailure(request.email());
            throw new BusinessException(
                    "CREDENCIALES_INVALIDAS", "Correo o contraseña incorrectos", HttpStatus.UNAUTHORIZED);
        }
        loginAttemptService.reset(request.email());
        if (user.isMfaEnabled()) {
            auditLogger.record("UserAccount", user.getId().toString(), "PASSWORD_OK", user.getEmail(), "MFA_REQUERIDO");
            return mfaService.beginChallenge(user);
        }
        return issueTokens(user);
    }

    @Transactional
    public void changePassword(String email, String currentPassword, String newPassword) {
        UserAccount user = userRepository
                .findByEmail(email)
                .orElseThrow(
                        () -> new BusinessException("NO_ENCONTRADO", "Usuario no encontrado", HttpStatus.NOT_FOUND));
        if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            throw new BusinessException(
                    "PASSWORD_INCORRECTA", "La contraseña actual no es correcta", HttpStatus.BAD_REQUEST);
        }
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        auditLogger.record("UserAccount", user.getId().toString(), "CAMBIO_PASSWORD", email, null);
    }

    @Transactional
    public Map<String, String> forgotPassword(String email) {
        UserAccount user = userRepository
                .findByEmail(email)
                .orElseThrow(() -> new BusinessException(
                        "USUARIO_NO_ENCONTRADO",
                        "No existe una cuenta con ese correo electrónico",
                        HttpStatus.NOT_FOUND));

        String resetToken = jwtService.generatePasswordResetToken(user.getEmail(), user.getId());
        auditLogger.record("UserAccount", user.getId().toString(), "SOLICITUD_RESET_PASSWORD", email, null);

        return Map.of("message", "Se ha generado el token de recuperación de contraseña", "resetToken", resetToken);
    }

    @Transactional
    public void resetPassword(String token, String newPassword) {
        if (!jwtService.isPasswordResetToken(token)) {
            throw new BusinessException(
                    "TOKEN_INVALIDO",
                    "El token proporcionado no es válido para restablecer contraseña",
                    HttpStatus.BAD_REQUEST);
        }

        String email = jwtService.extractEmail(token);
        UserAccount user = userRepository
                .findByEmail(email)
                .orElseThrow(
                        () -> new BusinessException("NO_ENCONTRADO", "Usuario no encontrado", HttpStatus.NOT_FOUND));

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        auditLogger.record("UserAccount", user.getId().toString(), "RESET_PASSWORD_EXITOSO", email, null);
    }

    private AuthResponse issueTokens(UserAccount user) {
        String access = jwtService.generateAccessToken(
                user.getEmail(), user.getId(), user.getRole().name());
        String refresh = jwtService.generateRefreshToken(
                user.getEmail(), user.getId(), user.getRole().name());
        return AuthResponse.of(
                access, refresh, user.getId(), user.getEmail(), user.getRole().name());
    }

    private Role parseRole(String role) {
        if (role == null || role.isBlank()) {
            return Role.CLIENT;
        }
        try {
            Role parsed = Role.valueOf(role.toUpperCase());
            if (parsed != Role.CLIENT && parsed != Role.PROVIDER) {
                throw new IllegalArgumentException();
            }
            return parsed;
        } catch (IllegalArgumentException e) {
            throw new BusinessException("ROL_INVALIDO", "El rol debe ser CLIENT o PROVIDER", HttpStatus.BAD_REQUEST);
        }
    }
}
