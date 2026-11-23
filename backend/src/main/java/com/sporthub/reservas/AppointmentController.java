package com.sporthub.reservas;

import com.sporthub.security.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/appointments")
@Tag(name = "Citas", description = "Ciclo de vida de las reservas (HU-33..HU-41)")
public class AppointmentController {

    private final AppointmentService appointmentService;

    public AppointmentController(AppointmentService appointmentService) {
        this.appointmentService = appointmentService;
    }

    @Operation(summary = "Consultar disponibilidad de citas (HU-33)")
    @GetMapping("/availability")
    public ResponseEntity<List<AvailabilityChecker.Slot>> availability(
            @RequestParam UUID serviceId, @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(appointmentService.availability(serviceId, date));
    }

    @Operation(summary = "Agendar cita (HU-34)")
    @PostMapping
    public ResponseEntity<AppointmentResponse> create(@Valid @RequestBody CreateAppointmentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(appointmentService.create(SecurityUtils.currentUser(), request));
    }

    @Operation(summary = "Consultar citas programadas con filtros (HU-35/HU-38, HU-44, HU-47)")
    @GetMapping
    public ResponseEntity<List<AppointmentResponse>> list(
            @RequestParam(required = false) AppointmentStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(appointmentService.listMine(SecurityUtils.currentUser(), status, from, to));
    }

    @Operation(summary = "Consultar detalle de una cita agendada (HU-35)")
    @GetMapping("/{id}")
    public ResponseEntity<AppointmentResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(appointmentService.getById(SecurityUtils.currentUser(), id));
    }

    @Operation(summary = "Confirmar solicitud de cita (HU-40)")
    @PatchMapping("/{id}/confirm")
    public ResponseEntity<AppointmentResponse> confirm(@PathVariable UUID id) {
        return ResponseEntity.ok(appointmentService.confirm(SecurityUtils.currentUser(), id));
    }

    @Operation(summary = "Reprogramar cita (HU-36)")
    @PatchMapping("/{id}/reschedule")
    public ResponseEntity<AppointmentResponse> reschedule(
            @PathVariable UUID id, @Valid @RequestBody RescheduleRequest request) {
        return ResponseEntity.ok(appointmentService.reschedule(SecurityUtils.currentUser(), id, request));
    }

    @Operation(summary = "Cancelar cita por el cliente (HU-37)")
    @PatchMapping("/{id}/cancel")
    public ResponseEntity<AppointmentResponse> cancel(
            @PathVariable UUID id, @RequestBody(required = false) CancelRequest request) {
        return ResponseEntity.ok(appointmentService.cancel(SecurityUtils.currentUser(), id, request));
    }

    @Operation(summary = "Registrar finalización de cita (HU-39)")
    @PatchMapping("/{id}/complete")
    public ResponseEntity<AppointmentResponse> complete(@PathVariable UUID id) {
        return ResponseEntity.ok(appointmentService.markCompleted(SecurityUtils.currentUser(), id));
    }

    @Operation(summary = "Cancelar cita por imprevisto del proveedor (HU-41)")
    @PatchMapping("/{id}/cancel-unforeseen")
    public ResponseEntity<AppointmentResponse> cancelUnforeseen(
            @PathVariable UUID id, @RequestBody(required = false) CancelRequest request) {
        return ResponseEntity.ok(appointmentService.cancelByUnforeseen(SecurityUtils.currentUser(), id, request));
    }
}
