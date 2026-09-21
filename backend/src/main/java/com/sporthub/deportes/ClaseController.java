package com.sporthub.deportes;

import com.sporthub.security.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
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
@RequestMapping("/api/v1/deportes/clases")
@Tag(name = "Clases grupales", description = "Dominio deportivo E9 (HU-63..HU-66)")
public class ClaseController {

    private final ClaseService claseService;

    public ClaseController(ClaseService claseService) {
        this.claseService = claseService;
    }

    @Operation(summary = "Registrar clase grupal (HU-63)")
    @PostMapping
    public ResponseEntity<ClaseResponse> registrar(@Valid @RequestBody CrearClaseRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(claseService.registrar(SecurityUtils.currentUser(), request));
    }

    @Operation(summary = "Consultar clases grupales (HU-63/HU-64)")
    @GetMapping
    public ResponseEntity<List<ClaseResponse>> listar(@RequestParam(required = false) UUID instalacionId) {
        return ResponseEntity.ok(claseService.listar(SecurityUtils.currentUser(), instalacionId));
    }

    @Operation(summary = "Inscribirse a clase grupal (HU-64)")
    @PostMapping("/{id}/inscripciones")
    public ResponseEntity<InscripcionClaseResponse> inscribir(@PathVariable UUID id) {
        return ResponseEntity.status(HttpStatus.CREATED).body(claseService.inscribir(SecurityUtils.currentUser(), id));
    }

    @Operation(summary = "Cancelar inscripción a clase (HU-65)")
    @PatchMapping("/inscripciones/{inscripcionId}/cancelar")
    public ResponseEntity<InscripcionClaseResponse> cancelar(@PathVariable UUID inscripcionId) {
        return ResponseEntity.ok(claseService.cancelarInscripcion(SecurityUtils.currentUser(), inscripcionId));
    }

    @Operation(summary = "Consultar mis inscripciones a clases")
    @GetMapping("/mias")
    public ResponseEntity<List<InscripcionClaseResponse>> misInscripciones() {
        return ResponseEntity.ok(claseService.misInscripciones(SecurityUtils.currentUser()));
    }

    @Operation(summary = "Completar clase y cerrar inscripciones confirmadas")
    @PatchMapping("/{id}/completar")
    public ResponseEntity<Long> completar(@PathVariable UUID id) {
        return ResponseEntity.ok(claseService.completar(SecurityUtils.currentUser(), id));
    }
}
