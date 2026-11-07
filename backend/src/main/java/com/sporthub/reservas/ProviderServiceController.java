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
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/services")
@Tag(name = "Servicios y Agenda", description = "Gestión de servicios y horarios del proveedor (HU-17..HU-27)")
public class ProviderServiceController {

    private final ServiceManagementService serviceManagementService;

    public ProviderServiceController(ServiceManagementService serviceManagementService) {
        this.serviceManagementService = serviceManagementService;
    }

    @Operation(summary = "Registrar nuevo servicio (HU-17)")
    @PostMapping
    @PreAuthorize("hasAnyRole('PROVIDER', 'ADMIN')")
    public ResponseEntity<ServiceResponse> create(@Valid @RequestBody CreateServiceRequest request) {
        UserAccount caller = SecurityUtils.currentUser();
        return ResponseEntity.status(HttpStatus.CREATED).body(serviceManagementService.createService(caller, request));
    }

    @Operation(summary = "Consultar catálogo de servicios disponibles (HU-20)")
    @GetMapping
    public ResponseEntity<List<ServiceResponse>> list(@RequestParam(required = false) UUID providerId) {
        return ResponseEntity.ok(serviceManagementService.listServices(providerId));
    }

    @Operation(summary = "Consultar servicios del proveedor autenticado")
    @GetMapping("/mine")
    @PreAuthorize("hasAnyRole('PROVIDER', 'STAFF', 'ADMIN')")
    public ResponseEntity<List<ServiceResponse>> listMine() {
        UserAccount caller = SecurityUtils.currentUser();
        return ResponseEntity.ok(serviceManagementService.listServicesForProvider(caller));
    }

    @Operation(summary = "Consultar detalle de un servicio por ID (HU-20)")
    @GetMapping("/{id}")
    public ResponseEntity<ServiceResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(serviceManagementService.getService(id));
    }

    @Operation(summary = "Modificar información del servicio (HU-21)")
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('PROVIDER', 'ADMIN')")
    public ResponseEntity<ServiceResponse> update(
            @PathVariable UUID id, @Valid @RequestBody UpdateServiceRequest request) {
        UserAccount caller = SecurityUtils.currentUser();
        return ResponseEntity.ok(serviceManagementService.updateService(caller, id, request));
    }

    @Operation(summary = "Activar o desactivar servicio (HU-18, HU-22)")
    @PatchMapping("/{id}/toggle-active")
    @PreAuthorize("hasAnyRole('PROVIDER', 'ADMIN')")
    public ResponseEntity<ServiceResponse> toggleActive(@PathVariable UUID id) {
        UserAccount caller = SecurityUtils.currentUser();
        return ResponseEntity.ok(serviceManagementService.toggleServiceActive(caller, id));
    }

    @Operation(summary = "Eliminar servicio")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('PROVIDER', 'ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        UserAccount caller = SecurityUtils.currentUser();
        serviceManagementService.deleteService(caller, id);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Consultar agenda y horarios del servicio (HU-25)")
    @GetMapping("/{id}/schedules")
    public ResponseEntity<List<ScheduleResponse>> listSchedules(@PathVariable UUID id) {
        return ResponseEntity.ok(serviceManagementService.listSchedules(id));
    }

    @Operation(summary = "Definir horario del servicio y asignar personal (HU-23, HU-28)")
    @PostMapping("/{id}/schedules")
    @PreAuthorize("hasAnyRole('PROVIDER', 'ADMIN')")
    public ResponseEntity<ScheduleResponse> createSchedule(
            @PathVariable UUID id, @Valid @RequestBody CreateScheduleRequest request) {
        UserAccount caller = SecurityUtils.currentUser();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(serviceManagementService.createSchedule(caller, id, request));
    }

    @Operation(summary = "Bloquear o desbloquear horario en agenda (HU-26)")
    @PatchMapping("/schedules/{scheduleId}/toggle-block")
    @PreAuthorize("hasAnyRole('PROVIDER', 'STAFF', 'ADMIN')")
    public ResponseEntity<ScheduleResponse> toggleBlockSchedule(@PathVariable UUID scheduleId) {
        UserAccount caller = SecurityUtils.currentUser();
        return ResponseEntity.ok(serviceManagementService.toggleScheduleBlocked(caller, scheduleId));
    }

    @Operation(summary = "Eliminar horario de agenda")
    @DeleteMapping("/schedules/{scheduleId}")
    @PreAuthorize("hasAnyRole('PROVIDER', 'ADMIN')")
    public ResponseEntity<Void> deleteSchedule(@PathVariable UUID scheduleId) {
        UserAccount caller = SecurityUtils.currentUser();
        serviceManagementService.deleteSchedule(caller, scheduleId);
        return ResponseEntity.noContent().build();
    }
}
