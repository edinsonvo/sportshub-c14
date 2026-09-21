package com.sporthub.deportes;

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
@RequestMapping("/api/v1/deportes/instalaciones")
@Tag(name = "Instalaciones deportivas", description = "Dominio deportivo E9 (HU-58..HU-62)")
public class InstalacionController {

    private final InstalacionService instalacionService;

    public InstalacionController(InstalacionService instalacionService) {
        this.instalacionService = instalacionService;
    }

    @Operation(summary = "Registrar instalación deportiva (HU-58)")
    @PostMapping
    public ResponseEntity<InstalacionResponse> registrar(@Valid @RequestBody CrearInstalacionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(instalacionService.registrar(SecurityUtils.currentUser(), request));
    }

    @Operation(summary = "Consultar instalaciones (HU-59)")
    @GetMapping
    public ResponseEntity<List<InstalacionResponse>> listar() {
        return ResponseEntity.ok(instalacionService.listar(SecurityUtils.currentUser()));
    }

    @Operation(summary = "Consultar disponibilidad de franjas por fecha (HU-59)")
    @GetMapping("/{id}/disponibilidad")
    public ResponseEntity<List<FranjaInstalacion>> disponibilidad(
            @PathVariable UUID id, @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha) {
        return ResponseEntity.ok(instalacionService.disponibilidad(id, fecha));
    }

    @Operation(summary = "Reservar instalación por turno (HU-60)")
    @PostMapping("/{id}/reservas")
    public ResponseEntity<ReservaInstalacionResponse> reservar(
            @PathVariable UUID id, @Valid @RequestBody ReservarInstalacionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(instalacionService.reservar(SecurityUtils.currentUser(), id, request));
    }

    @Operation(summary = "Cancelar reserva de instalación")
    @PatchMapping("/reservas/{reservaId}/cancelar")
    public ResponseEntity<ReservaInstalacionResponse> cancelarReserva(@PathVariable UUID reservaId) {
        return ResponseEntity.ok(instalacionService.cancelarReserva(SecurityUtils.currentUser(), reservaId));
    }

    @Operation(summary = "Bloquear instalación por mantenimiento (HU-61)")
    @PostMapping("/{id}/mantenimiento")
    public ResponseEntity<MantenimientoInstalacionResponse> bloquear(
            @PathVariable UUID id, @Valid @RequestBody BloquearInstalacionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(instalacionService.bloquearMantenimiento(SecurityUtils.currentUser(), id, request));
    }

    @Operation(summary = "Solicitar lista de espera de instalación (HU-62)")
    @PostMapping("/{id}/lista-espera")
    public ResponseEntity<ListaEsperaResponse> listaEspera(
            @PathVariable UUID id, @Valid @RequestBody SolicitarListaEsperaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(instalacionService.solicitarListaEspera(SecurityUtils.currentUser(), id, request));
    }

    @Operation(summary = "Consultar mis reservas de instalaciones")
    @GetMapping("/reservas")
    public ResponseEntity<List<ReservaInstalacionResponse>> misReservas() {
        return ResponseEntity.ok(instalacionService.misReservas(SecurityUtils.currentUser()));
    }
}
