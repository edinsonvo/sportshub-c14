package com.sporthub.auth;

import com.sporthub.auth.mfa.MfaSendCodeResponse;
import com.sporthub.auth.mfa.MfaService;
import com.sporthub.auth.mfa.MfaSetupResponse;
import com.sporthub.security.SecurityUtils;
import com.sporthub.user.UserAccount;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth/mfa")
@Tag(name = "Multifactor (MFA)", description = "TOTP y OTP por correo: enrolamiento, verificación y desactivación")
public class MfaController {

    private final MfaService mfaService;

    public MfaController(MfaService mfaService) {
        this.mfaService = mfaService;
    }

    @Operation(summary = "Generar secreto y QR para TOTP")
    @GetMapping("/setup")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<MfaSetupResponse> setup() {
        return ResponseEntity.ok(mfaService.setup(SecurityUtils.currentUser()));
    }

    @Operation(summary = "Activar MFA (TOTP o correo) con un código")
    @PostMapping("/enable")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, String>> enable(@Valid @RequestBody MfaEnableRequest request) {
        mfaService.enable(SecurityUtils.currentUser(), request.method(), request.code());
        return ResponseEntity.ok(Map.of("message", "MFA activado correctamente"));
    }

    @Operation(summary = "Enviar código OTP al correo (para habilitar MFA por correo)")
    @PostMapping("/enable/send-code")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<MfaSendCodeResponse> sendEnableCode() {
        return ResponseEntity.ok(mfaService.sendEmailCode(SecurityUtils.currentUser()));
    }

    @Operation(summary = "Enviar código OTP al correo (segundo paso del login por correo)")
    @PostMapping("/send-code")
    public ResponseEntity<MfaSendCodeResponse> sendLoginCode(@Valid @RequestBody MfaSendCodeRequest request) {
        return ResponseEntity.ok(mfaService.sendLoginEmailCode(request.challengeToken()));
    }

    @Operation(summary = "Completar el inicio de sesión con el código MFA")
    @PostMapping("/verify")
    public ResponseEntity<AuthResponse> verify(@Valid @RequestBody MfaVerifyRequest request) {
        return ResponseEntity.ok(
                mfaService.verifyChallenge(request.challengeToken(), request.method(), request.code()));
    }

    @Operation(summary = "Desactivar MFA (requiere la contraseña)")
    @PostMapping("/disable")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, String>> disable(@Valid @RequestBody DisableMfaRequest request) {
        UserAccount user = SecurityUtils.currentUser();
        mfaService.disable(user, request.password());
        return ResponseEntity.ok(Map.of("message", "MFA desactivado"));
    }
}