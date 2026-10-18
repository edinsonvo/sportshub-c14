package com.sporthub.deportes;

import com.sporthub.security.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/deportes/proveedor")
@Tag(name = "Proveedor deportivo", description = "Dominio deportivo E9 (perfil y equipo)")
public class ProveedorController {

    private final ProveedorService proveedorService;

    public ProveedorController(ProveedorService proveedorService) {
        this.proveedorService = proveedorService;
    }

    @Operation(summary = "Consultar el perfil de proveedor del usuario y su equipo de trabajo")
    @GetMapping("/me")
    public ResponseEntity<ProveedorResponse> me() {
        return ResponseEntity.ok(proveedorService.me(SecurityUtils.currentUser()));
    }
}