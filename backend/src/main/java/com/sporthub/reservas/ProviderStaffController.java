package com.sporthub.reservas;

import com.sporthub.security.SecurityUtils;
import com.sporthub.user.UserAccount;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/staff")
@Tag(name = "Personal Operativo", description = "Gestión de personal y agenda de empleados (HU-28..HU-32)")
public class ProviderStaffController {

    private final StaffManagementService staffManagementService;

    public ProviderStaffController(StaffManagementService staffManagementService) {
        this.staffManagementService = staffManagementService;
    }

    @Operation(summary = "Consultar el equipo de personal operativo del proveedor (HU-29)")
    @GetMapping
    @PreAuthorize("hasAnyRole('PROVIDER', 'ADMIN')")
    public ResponseEntity<List<StaffMemberResponse>> list() {
        UserAccount caller = SecurityUtils.currentUser();
        return ResponseEntity.ok(staffManagementService.listStaff(caller));
    }

    @Operation(summary = "Registrar nuevo personal operativo (HU-29)")
    @PostMapping
    @PreAuthorize("hasAnyRole('PROVIDER', 'ADMIN')")
    public ResponseEntity<StaffMemberResponse> create(@Valid @RequestBody CreateStaffRequest request) {
        UserAccount caller = SecurityUtils.currentUser();
        return ResponseEntity.status(HttpStatus.CREATED).body(staffManagementService.createStaff(caller, request));
    }

    @Operation(summary = "Activar o desactivar personal operativo (HU-32)")
    @PatchMapping("/{id}/toggle-active")
    @PreAuthorize("hasAnyRole('PROVIDER', 'ADMIN')")
    public ResponseEntity<StaffMemberResponse> toggleActive(@PathVariable UUID id) {
        UserAccount caller = SecurityUtils.currentUser();
        return ResponseEntity.ok(staffManagementService.toggleStaffActive(caller, id));
    }

    @Operation(summary = "Consultar citas asignadas al empleado autenticado (HU-35)")
    @GetMapping("/me/appointments")
    @PreAuthorize("hasAnyRole('STAFF', 'PROVIDER', 'ADMIN')")
    public ResponseEntity<List<AppointmentResponse>> myAppointments() {
        UserAccount caller = SecurityUtils.currentUser();
        return ResponseEntity.ok(staffManagementService.getStaffAppointments(caller));
    }
}
