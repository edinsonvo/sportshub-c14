package com.sporthub.auth;

import com.sporthub.security.SecurityUtils;
import com.sporthub.user.UserAccount;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Autenticación", description = "Registro, inicio de sesión y gestión de credenciales (HU-01, HU-12..HU-15)")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @Operation(summary = "Registrar cuenta de usuario (HU-01/HU-06)")
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    @Operation(summary = "Iniciar sesión (HU-12)")
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @Operation(summary = "Consultar perfil del usuario autenticado (HU-03)")
    @GetMapping("/me")
    public ResponseEntity<AuthResponse.Info> me() {
        UserAccount user = SecurityUtils.currentUser();
        return ResponseEntity.ok(new AuthResponse.Info(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.isMfaEnabled(),
                user.isMfaEnabled() && user.getMfaMethod() != null
                        ? user.getMfaMethod().name()
                        : null,
                user.getCreatedAt()));
    }

    @Operation(summary = "Cambiar contraseña (HU-14)")
    @PutMapping("/change-password")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, String>> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        UserAccount user = SecurityUtils.currentUser();
        authService.changePassword(user.getEmail(), request.currentPassword(), request.newPassword());
        return ResponseEntity.ok(Map.of("message", "Contraseña actualizada"));
    }

    @Operation(summary = "Solicitar recuperación de contraseña (HU-15)")
    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        return ResponseEntity.ok(authService.forgotPassword(request.email()));
    }

    @Operation(summary = "Restablecer contraseña con token (HU-15)")
    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request.token(), request.newPassword());
        return ResponseEntity.ok(Map.of("message", "Contraseña restablecida con éxito"));
    }
}
