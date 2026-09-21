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
@RequestMapping("/api/v1/deportes/membresias")
@Tag(name = "Membresías", description = "Dominio deportivo E9 (HU-67..HU-70)")
public class MembresiaController {

    private final MembresiaService membresiaService;

    public MembresiaController(MembresiaService membresiaService) {
        this.membresiaService = membresiaService;
    }

    @Operation(summary = "Crear plan de membresía (HU-67)")
    @PostMapping("/planes")
    public ResponseEntity<PlanMembresiaResponse> crearPlan(@Valid @RequestBody CrearPlanMembresiaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(membresiaService.crearPlan(SecurityUtils.currentUser(), request));
    }

    @Operation(summary = "Consultar planes de membresía (HU-67/HU-68)")
    @GetMapping("/planes")
    public ResponseEntity<List<PlanMembresiaResponse>> listarPlanes() {
        return ResponseEntity.ok(membresiaService.listarPlanes(SecurityUtils.currentUser()));
    }

    @Operation(summary = "Comprar o renovar membresía (HU-68)")
    @PostMapping("/comprar")
    public ResponseEntity<MembresiaResponse> comprar(@Valid @RequestBody ComprarMembresiaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(membresiaService.comprar(SecurityUtils.currentUser(), request));
    }

    @Operation(summary = "Suspender membresía por incumplimiento (HU-70)")
    @PatchMapping("/{id}/suspender")
    public ResponseEntity<MembresiaResponse> suspender(
            @PathVariable UUID id, @Valid @RequestBody SuspenderMembresiaRequest request) {
        return ResponseEntity.ok(membresiaService.suspender(SecurityUtils.currentUser(), id, request.motivo()));
    }

    @Operation(summary = "Consultar mis membresías (HU-68/HU-69)")
    @GetMapping("/mias")
    public ResponseEntity<List<MembresiaResponse>> mis() {
        return ResponseEntity.ok(membresiaService.mis(SecurityUtils.currentUser()));
    }

    @Operation(summary = "Calcular beneficio de membresía sobre una tarifa (HU-69)")
    @PostMapping("/beneficio")
    public ResponseEntity<BeneficioResponse> beneficio(@Valid @RequestBody BeneficioRequest request) {
        return ResponseEntity.ok(membresiaService.beneficio(SecurityUtils.currentUser(), request));
    }
}
