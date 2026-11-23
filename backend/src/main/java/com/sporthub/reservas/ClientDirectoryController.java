package com.sporthub.reservas;

import com.sporthub.security.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/appointments")
@Tag(name = "Clientes", description = "Directorio de clientes con citas en el centro del proveedor")
public class ClientDirectoryController {

    private final ClientDirectoryService clientDirectoryService;

    public ClientDirectoryController(ClientDirectoryService clientDirectoryService) {
        this.clientDirectoryService = clientDirectoryService;
    }

    @Operation(summary = "Listar clientes con citas visibles para el usuario autenticado")
    @GetMapping("/clients")
    @PreAuthorize("hasAnyRole('CLIENT', 'PROVIDER', 'STAFF', 'ADMIN')")
    public ResponseEntity<List<ClientSummaryResponse>> listClients() {
        return ResponseEntity.ok(clientDirectoryService.listClients(SecurityUtils.currentUser()));
    }
}
