package com.sporthub.auth.mfa;

import com.sporthub.auth.AuthResponse;
import com.sporthub.infra.AuditLogger;
import com.sporthub.infra.BusinessException;
import com.sporthub.security.JwtService;
import com.sporthub.user.UserAccount;
import com.sporthub.user.UserRepository;
import io.jsonwebtoken.Claims;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

/**
 * Autenticación multifactor: enrolamiento (setup/enable), verificación en el inicio de
 * sesión y desactivación. Soporta TOTP (app de autenticación) y OTP por correo.
 */
@Service
public class MfaService {

    private static final String CHALLENGE_TYPE = "mfa";
    private static final List<MfaMethod> AVAILABLE_METHODS = List.of(MfaMethod.TOTP, MfaMethod.EMAIL);

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final MfaOtpService otpService;
    private final MfaCodeSender codeSender;
    private final PasswordEncoder passwordEncoder;
    private final AuditLogger auditLogger;

    @Value("${sporthub.mfa.email.otp-ttl-seconds:300}")
    private long otpTtlSeconds;

    @Value("${sporthub.mfa.totp.issuer:SportHub}")
    private String totpIssuer;

    public MfaService(
            UserRepository userRepository,
            JwtService jwtService,
            MfaOtpService otpService,
            MfaCodeSender codeSender,
            PasswordEncoder passwordEncoder,
            AuditLogger auditLogger) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.otpService = otpService;
        this.codeSender = codeSender;
        this.passwordEncoder = passwordEncoder;
        this.auditLogger = auditLogger;
    }

    public AuthResponse beginChallenge(UserAccount user) {
        String challenge = jwtService.generateMfaChallenge(user.getEmail(), user.getId(), user.getRole().name());
        return AuthResponse.pending(user.getId(), user.getEmail(), user.getRole().name(), AVAILABLE_METHODS, challenge);
    }

    public MfaSetupResponse setup(UserAccount user) {
        String secret = Totp.generateSecret();
        user.setMfaSecret(secret);
        userRepository.save(user);
        auditLogger.record("UserAccount", user.getId().toString(), "MFA_SETUP", user.getEmail(), null);
        return new MfaSetupResponse(secret, Totp.otpauthUri(totpIssuer, user.getEmail(), secret));
    }

    public void enable(UserAccount user, MfaMethod method, String code) {
        if (method == MfaMethod.TOTP) {
            String secret = user.getMfaSecret();
            if (secret == null) {
                throw new BusinessException(
                        "MFA_NO_SECRET", "Primero genera el código QR para configurar la app", HttpStatus.BAD_REQUEST);
            }
            if (!Totp.verify(secret, code)) {
                throw new BusinessException("CODIGO_INVALIDO", "El código no es válido", HttpStatus.BAD_REQUEST);
            }
        } else {
            if (!otpService.verify(user, code)) {
                throw new BusinessException("CODIGO_INVALIDO", "El código no es válido", HttpStatus.BAD_REQUEST);
            }
            user.setMfaSecret(null);
        }
        user.enableMfa(method);
        userRepository.save(user);
        auditLogger.record("UserAccount", user.getId().toString(), "MFA_ACTIVADO", user.getEmail(), method.name());
    }

    public MfaSendCodeResponse sendEmailCode(UserAccount user) {
        codeSender.send(user.getEmail(), otpService.generate(user));
        return new MfaSendCodeResponse((int) otpTtlSeconds);
    }

    public MfaSendCodeResponse sendLoginEmailCode(String challengeToken) {
        UserAccount user = userFromChallenge(challengeToken);
        if (!user.isMfaEnabled() || user.getMfaMethod() != MfaMethod.EMAIL) {
            throw new BusinessException(
                    "MFA_NO_ACTIVADA", "El usuario no tiene MFA por correo activado", HttpStatus.BAD_REQUEST);
        }
        codeSender.send(user.getEmail(), otpService.generate(user));
        return new MfaSendCodeResponse((int) otpTtlSeconds);
    }

    public AuthResponse verifyChallenge(String challengeToken, MfaMethod method, String code) {
        UserAccount user = userFromChallenge(challengeToken);
        boolean valid;
        if (method == MfaMethod.TOTP) {
            valid = user.isMfaEnabled() && user.getMfaMethod() == MfaMethod.TOTP && Totp.verify(user.getMfaSecret(), code);
        } else if (method == MfaMethod.EMAIL) {
            valid = user.isMfaEnabled() && user.getMfaMethod() == MfaMethod.EMAIL && otpService.verify(user, code);
        } else {
            valid = false;
        }
        if (!valid) {
            throw new BusinessException("CODIGO_INVALIDO", "El código de verificación no es válido", HttpStatus.BAD_REQUEST);
        }
        auditLogger.record("UserAccount", user.getId().toString(), "MFA_VERIFICADO", user.getEmail(), method.name());
        return AuthResponse.of(
                jwtService.generateAccessToken(user.getEmail(), user.getId(), user.getRole().name()),
                jwtService.generateRefreshToken(user.getEmail(), user.getId(), user.getRole().name()),
                user.getId(),
                user.getEmail(),
                user.getRole().name());
    }

    public void disable(UserAccount user, String password) {
        if (password == null || !passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new BusinessException(
                    "PASSWORD_INCORRECTA", "La contraseña no es correcta", HttpStatus.BAD_REQUEST);
        }
        otpService.clear(user.getId().toString());
        user.disableMfa();
        userRepository.save(user);
        auditLogger.record("UserAccount", user.getId().toString(), "MFA_DESACTIVADO", user.getEmail(), null);
    }

    private UserAccount userFromChallenge(String challengeToken) {
        if (challengeToken == null || challengeToken.isBlank()) {
            throw new BusinessException("CHALLENGE_INVALIDO", "Sesión MFA inválida", HttpStatus.UNAUTHORIZED);
        }
        Claims claims;
        try {
            claims = jwtService.parse(challengeToken);
        } catch (Exception e) {
            throw new BusinessException("CHALLENGE_INVALIDO", "La sesión MFA ha expirado", HttpStatus.UNAUTHORIZED);
        }
        if (!CHALLENGE_TYPE.equals(claims.get("type", String.class))) {
            throw new BusinessException("CHALLENGE_INVALIDO", "Sesión MFA inválida", HttpStatus.UNAUTHORIZED);
        }
        return userRepository
                .findByEmail(claims.getSubject())
                .filter(UserAccount::isActive)
                .orElseThrow(() -> new BusinessException(
                        "CHALLENGE_INVALIDO", "Sesión MFA inválida", HttpStatus.UNAUTHORIZED));
    }
}