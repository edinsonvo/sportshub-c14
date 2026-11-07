package com.sporthub.reservas;

import com.sporthub.infra.AuditLogger;
import com.sporthub.infra.BusinessException;
import com.sporthub.security.SecurityUtils;
import com.sporthub.user.Role;
import com.sporthub.user.UserAccount;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/providers")
@Tag(name = "Perfil de Proveedor", description = "Gestión de datos de negocio y logotipo (HU-07, HU-11)")
public class ProviderProfileController {

    private final ProviderRepository providerRepository;
    private final ProviderStaffRepository staffRepository;
    private final AuditLogger auditLogger;

    public ProviderProfileController(
            ProviderRepository providerRepository, ProviderStaffRepository staffRepository, AuditLogger auditLogger) {
        this.providerRepository = providerRepository;
        this.staffRepository = staffRepository;
        this.auditLogger = auditLogger;
    }

    @Operation(summary = "Consultar el perfil del proveedor del usuario actual (HU-07)")
    @GetMapping("/profile")
    @PreAuthorize("hasAnyRole('PROVIDER', 'STAFF', 'ADMIN')")
    public ResponseEntity<ProviderProfileResponse> getProfile() {
        UserAccount current = SecurityUtils.currentUser();
        Provider provider = resolveProvider(current);
        return ResponseEntity.ok(ProviderProfileResponse.from(provider));
    }

    @Operation(summary = "Actualizar datos y logotipo del proveedor (HU-07, HU-11)")
    @PutMapping("/profile")
    @PreAuthorize("hasAnyRole('PROVIDER', 'ADMIN')")
    public ResponseEntity<ProviderProfileResponse> updateProfile(
            @Valid @RequestBody UpdateProviderProfileRequest request) {
        UserAccount current = SecurityUtils.currentUser();
        Provider provider = resolveProvider(current);

        provider.setBusinessName(request.businessName());
        if (request.documentNumber() != null) {
            provider.setDocumentNumber(request.documentNumber());
        }
        if (request.logoUrl() != null) {
            provider.setLogoUrl(request.logoUrl());
        }

        providerRepository.save(provider);
        auditLogger.record(
                "Provider",
                provider.getId().toString(),
                "PERFIL_PROVEEDOR_ACTUALIZADO",
                current.getEmail(),
                provider.getBusinessName());
        return ResponseEntity.ok(ProviderProfileResponse.from(provider));
    }

    private Provider resolveProvider(UserAccount user) {
        if (user.getRole() == Role.PROVIDER) {
            return providerRepository
                    .findByUserId(user.getId())
                    .orElseThrow(() -> new BusinessException(
                            "PROVEEDOR_NO_ENCONTRADO", "No tienes perfil de proveedor", HttpStatus.NOT_FOUND));
        }
        if (user.getRole() == Role.STAFF) {
            return staffRepository
                    .findByUserId(user.getId())
                    .flatMap(s -> providerRepository.findById(s.getProviderId()))
                    .orElseThrow(() -> new BusinessException(
                            "STAFF_NO_ASIGNADO", "No estás asignado a un proveedor", HttpStatus.FORBIDDEN));
        }
        if (user.getRole() == Role.ADMIN) {
            return providerRepository.findAll().stream()
                    .findFirst()
                    .orElseThrow(() -> new BusinessException(
                            "NO_PROVEEDORES", "No hay proveedores registrados", HttpStatus.NOT_FOUND));
        }
        throw new BusinessException("FORBIDDEN", "No tienes permisos de proveedor", HttpStatus.FORBIDDEN);
    }
}
