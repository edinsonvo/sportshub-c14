package com.sporthub.admin;

import com.sporthub.infra.AuditLog;
import com.sporthub.reservas.AppointmentResponse;
import com.sporthub.reservas.AppointmentService;
import com.sporthub.reservas.AppointmentStatus;
import com.sporthub.security.SecurityUtils;
import com.sporthub.user.Role;
import com.sporthub.user.UserAccount;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin")
@PreAuthorize("hasRole('ADMIN')")
@Tag(
        name = "Administración",
        description =
                "Operaciones administrativas de plataforma (HU-04, HU-05, HU-08, HU-09, HU-10, HU-43, HU-48, HU-50)")
public class AdminController {

    private final AdminService adminService;
    private final AppointmentService appointmentService;

    public AdminController(AdminService adminService, AppointmentService appointmentService) {
        this.adminService = adminService;
        this.appointmentService = appointmentService;
    }

    @Operation(summary = "Consultar listado de usuarios de la plataforma")
    @GetMapping("/users")
    public ResponseEntity<List<AdminUserResponse>> listUsers(
            @RequestParam(required = false) Role role, @RequestParam(required = false) Boolean active) {
        return ResponseEntity.ok(adminService.listUsers(role, active));
    }

    @Operation(summary = "Activar o desactivar temporalmente una cuenta de usuario (HU-04)")
    @PatchMapping("/users/{id}/toggle-active")
    public ResponseEntity<AdminUserResponse> toggleUserActive(@PathVariable UUID id) {
        UserAccount admin = SecurityUtils.currentUser();
        return ResponseEntity.ok(adminService.toggleUserActive(admin, id));
    }

    @Operation(summary = "Eliminar cuenta de usuario (HU-05)")
    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable UUID id) {
        UserAccount admin = SecurityUtils.currentUser();
        adminService.deleteUser(admin, id);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Consultar listado de proveedores registrados")
    @GetMapping("/providers")
    public ResponseEntity<List<AdminProviderResponse>> listProviders() {
        return ResponseEntity.ok(adminService.listProviders());
    }

    @Operation(summary = "Verificar identidad del proveedor (HU-08, HU-09)")
    @PatchMapping("/providers/{id}/verify")
    public ResponseEntity<AdminProviderResponse> verifyProvider(
            @PathVariable UUID id, @RequestParam(defaultValue = "true") boolean verify) {
        UserAccount admin = SecurityUtils.currentUser();
        return ResponseEntity.ok(adminService.verifyProvider(admin, id, verify));
    }

    @Operation(summary = "Activar o suspender proveedor (HU-10)")
    @PatchMapping("/providers/{id}/toggle-active")
    public ResponseEntity<AdminProviderResponse> toggleProviderActive(@PathVariable UUID id) {
        UserAccount admin = SecurityUtils.currentUser();
        return ResponseEntity.ok(adminService.toggleProviderActive(admin, id));
    }

    @Operation(summary = "Consultar historial global de citas con filtros (HU-43, HU-47)")
    @GetMapping("/appointments")
    public ResponseEntity<List<AppointmentResponse>> listGlobalAppointments(
            @RequestParam(required = false) AppointmentStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        UserAccount admin = SecurityUtils.currentUser();
        return ResponseEntity.ok(appointmentService.listMine(admin, status, from, to));
    }

    @Operation(summary = "Consultar registro de auditoría de la plataforma")
    @GetMapping("/audit-logs")
    public ResponseEntity<List<AuditLog>> listAuditLogs() {
        return ResponseEntity.ok(adminService.listAuditLogs());
    }

    @Operation(summary = "Métricas y estadísticas del sistema (HU-48, HU-50)")
    @GetMapping("/stats")
    public ResponseEntity<SystemStatsResponse> getStats() {
        return ResponseEntity.ok(adminService.getStats());
    }
}
