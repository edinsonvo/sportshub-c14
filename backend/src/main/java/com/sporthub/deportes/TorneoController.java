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
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/deportes/torneos")
@Tag(name = "Torneos y eventos", description = "Dominio deportivo E9 (HU-74..HU-76)")
public class TorneoController {

    private final TorneoService torneoService;

    public TorneoController(TorneoService torneoService) {
        this.torneoService = torneoService;
    }

    @Operation(summary = "Crear torneo o evento deportivo (HU-74)")
    @PostMapping
    public ResponseEntity<TorneoResponse> crear(@Valid @RequestBody CrearTorneoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(torneoService.crear(SecurityUtils.currentUser(), request));
    }

    @Operation(summary = "Consultar torneos (HU-74/HU-75)")
    @GetMapping
    public ResponseEntity<List<TorneoResponse>> listar() {
        return ResponseEntity.ok(torneoService.listar());
    }

    @Operation(summary = "Inscribir participante a torneo (HU-75)")
    @PostMapping("/{id}/inscripciones")
    public ResponseEntity<ParticipanteResponse> inscribir(
            @PathVariable UUID id, @RequestBody(required = false) InscribirTorneoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(torneoService.inscribir(SecurityUtils.currentUser(), id, request));
    }

    @Operation(summary = "Abrir torneo y generar llaves (HU-76)")
    @PatchMapping("/{id}/abrir")
    public ResponseEntity<TorneoResponse> abrir(@PathVariable UUID id) {
        return ResponseEntity.ok(torneoService.abrir(SecurityUtils.currentUser(), id));
    }

    @Operation(summary = "Consultar partidos de un torneo (HU-76)")
    @GetMapping("/{id}/partidos")
    public ResponseEntity<List<PartidoResponse>> partidos(@PathVariable UUID id) {
        return ResponseEntity.ok(torneoService.partidos(id));
    }

    @Operation(summary = "Registrar resultado de partido (HU-76)")
    @PatchMapping("/partidos/{partidoId}/resultado")
    public ResponseEntity<PartidoResponse> resultado(
            @PathVariable UUID partidoId, @Valid @RequestBody RegistrarResultadoRequest request) {
        return ResponseEntity.ok(torneoService.registrarResultado(SecurityUtils.currentUser(), partidoId, request));
    }

    @Operation(summary = "Consultar ranking del torneo (HU-76)")
    @GetMapping("/{id}/ranking")
    public ResponseEntity<List<RankingEntry>> ranking(@PathVariable UUID id) {
        return ResponseEntity.ok(torneoService.ranking(id));
    }

    @Operation(summary = "Finalizar torneo")
    @PatchMapping("/{id}/finalizar")
    public ResponseEntity<TorneoResponse> finalizar(@PathVariable UUID id) {
        return ResponseEntity.ok(torneoService.finalizar(SecurityUtils.currentUser(), id));
    }
}
