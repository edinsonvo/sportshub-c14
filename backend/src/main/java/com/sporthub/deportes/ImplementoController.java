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
@RequestMapping("/api/v1/deportes/implementos")
@Tag(name = "Alquiler de implementos", description = "Dominio deportivo E9 (HU-71..HU-73)")
public class ImplementoController {

    private final ImplementoService implementoService;

    public ImplementoController(ImplementoService implementoService) {
        this.implementoService = implementoService;
    }

    @Operation(summary = "Registrar implemento deportivo (HU-71)")
    @PostMapping
    public ResponseEntity<ImplementoResponse> registrar(@Valid @RequestBody CrearImplementoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(implementoService.registrar(SecurityUtils.currentUser(), request));
    }

    @Operation(summary = "Consultar implementos (HU-71/HU-72)")
    @GetMapping
    public ResponseEntity<List<ImplementoResponse>> listar() {
        return ResponseEntity.ok(implementoService.listar(SecurityUtils.currentUser()));
    }

    @Operation(summary = "Consultar disponibilidad de un implemento (HU-72)")
    @GetMapping("/{id}/disponibilidad")
    public ResponseEntity<Integer> disponibilidad(
            @PathVariable UUID id, @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha) {
        return ResponseEntity.ok(implementoService.disponibilidad(id, fecha));
    }

    @Operation(summary = "Reservar implemento deportivo (HU-72)")
    @PostMapping("/{id}/reservas")
    public ResponseEntity<ReservaImplementoResponse> reservar(
            @PathVariable UUID id, @Valid @RequestBody ReservarImplementoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(implementoService.reservar(SecurityUtils.currentUser(), id, request));
    }

    @Operation(summary = "Prestar implemento (HU-72)")
    @PatchMapping("/reservas/{reservaId}/prestar")
    public ResponseEntity<ReservaImplementoResponse> prestar(@PathVariable UUID reservaId) {
        return ResponseEntity.ok(implementoService.prestar(SecurityUtils.currentUser(), reservaId));
    }

    @Operation(summary = "Registrar devolución y estado del implemento (HU-73)")
    @PatchMapping("/reservas/{reservaId}/devolver")
    public ResponseEntity<ReservaImplementoResponse> devolver(
            @PathVariable UUID reservaId, @Valid @RequestBody RegistrarDevolucionRequest request) {
        return ResponseEntity.ok(
                implementoService.devolver(SecurityUtils.currentUser(), reservaId, request.condicion()));
    }

    @Operation(summary = "Consultar mis reservas de implementos")
    @GetMapping("/mias")
    public ResponseEntity<List<ReservaImplementoResponse>> mis() {
        return ResponseEntity.ok(implementoService.mis(SecurityUtils.currentUser()));
    }

    @Operation(summary = "Consultar reservas de implementos a gestionar por el proveedor o administrador (HU-72/HU-73)")
    @GetMapping("/reservas")
    public ResponseEntity<List<ReservaImplementoGestionResponse>> gestionReservas() {
        return ResponseEntity.ok(implementoService.gestionReservas(SecurityUtils.currentUser()));
    }
}
