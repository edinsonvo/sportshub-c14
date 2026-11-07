package com.sporthub.user;

import com.sporthub.infra.AuditLogger;
import com.sporthub.security.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/users")
@Tag(name = "Usuarios", description = "Gestión del perfil de usuario y autoservicio (HU-02, HU-03, HU-04)")
public class UserController {

    private final UserRepository userRepository;
    private final AuditLogger auditLogger;

    public UserController(UserRepository userRepository, AuditLogger auditLogger) {
        this.userRepository = userRepository;
        this.auditLogger = auditLogger;
    }

    @Operation(summary = "Consultar perfil del usuario autenticado (HU-03)")
    @GetMapping("/profile")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UserProfileResponse> getProfile() {
        UserAccount current = SecurityUtils.currentUser();
        return ResponseEntity.ok(UserProfileResponse.from(current));
    }

    @Operation(summary = "Actualizar datos del perfil de usuario (HU-02)")
    @PutMapping("/profile")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UserProfileResponse> updateProfile(@Valid @RequestBody UpdateProfileRequest request) {
        UserAccount current = SecurityUtils.currentUser();
        current.setFullName(request.fullName());
        current.setPhone(request.phone());
        userRepository.save(current);

        auditLogger.record("UserAccount", current.getId().toString(), "PERFIL_ACTUALIZADO", current.getEmail(), null);
        return ResponseEntity.ok(UserProfileResponse.from(current));
    }

    @Operation(summary = "Desactivar temporalmente la cuenta propia (HU-04)")
    @PostMapping("/deactivate")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, String>> deactivateSelf() {
        UserAccount current = SecurityUtils.currentUser();
        current.setActive(false);
        userRepository.save(current);

        auditLogger.record("UserAccount", current.getId().toString(), "AUTO_DESACTIVADO", current.getEmail(), null);
        return ResponseEntity.ok(Map.of("message", "Tu cuenta ha sido desactivada temporalmente"));
    }
}
