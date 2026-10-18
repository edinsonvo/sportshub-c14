package com.sporthub.deportes;

import com.sporthub.infra.AuditLogger;
import com.sporthub.infra.BusinessException;
import com.sporthub.infra.SportHubMetrics;
import com.sporthub.reservas.Provider;
import com.sporthub.reservas.ProviderRepository;
import com.sporthub.user.Role;
import com.sporthub.user.UserAccount;
import com.sporthub.user.UserRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MembresiaService {

    private final PlanMembresiaRepository planRepository;
    private final MembresiaRepository membresiaRepository;
    private final ProviderRepository providerRepository;
    private final UserRepository userRepository;
    private final AuditLogger auditLogger;
    private final SportHubMetrics metrics;

    public MembresiaService(
            PlanMembresiaRepository planRepository,
            MembresiaRepository membresiaRepository,
            ProviderRepository providerRepository,
            UserRepository userRepository,
            AuditLogger auditLogger,
            SportHubMetrics metrics) {
        this.planRepository = planRepository;
        this.membresiaRepository = membresiaRepository;
        this.providerRepository = providerRepository;
        this.userRepository = userRepository;
        this.auditLogger = auditLogger;
        this.metrics = metrics;
    }

    @Transactional
    public PlanMembresiaResponse crearPlan(UserAccount caller, CrearPlanMembresiaRequest request) {
        PlanMembresia plan = new PlanMembresia(
                requireProviderId(caller),
                request.nombre(),
                request.vigenciaDias(),
                request.descuentoPorcentaje(),
                request.precio(),
                request.beneficios());
        planRepository.save(plan);
        auditLogger.record("PlanMembresia", plan.getId().toString(), "CREADO", caller.getEmail(), null);
        return PlanMembresiaResponse.from(plan);
    }

    @Transactional(readOnly = true)
    public List<PlanMembresiaResponse> listarPlanes(UserAccount caller) {
        return planRepository.findByActivoTrueOrderByNombreAsc().stream()
                .map(PlanMembresiaResponse::from)
                .toList();
    }

    @Transactional
    public MembresiaResponse comprar(UserAccount client, ComprarMembresiaRequest request) {
        PlanMembresia plan = planRepository
                .findByIdAndActivoTrue(request.planId())
                .orElseThrow(() -> new BusinessException(
                        "PLAN_INACTIVO", "El plan no existe o no está activo", HttpStatus.NOT_FOUND));
        LocalDate hoy = LocalDate.now();
        Membresia membresia = membresiaRepository
                .findFirstByClientIdAndEstadoOrderByFechaFinDesc(client.getId(), MembresiaEstado.ACTIVA)
                .filter(m -> !m.getFechaFin().isBefore(hoy))
                .map(m -> {
                    m.renovar(plan.getVigenciaDias());
                    return m;
                })
                .orElseGet(
                        () -> new Membresia(plan.getId(), client.getId(), hoy, hoy.plusDays(plan.getVigenciaDias())));
        membresiaRepository.save(membresia);
        metrics.membresiaComprada();
        auditLogger.record("Membresia", membresia.getId().toString(), "ACTIVA", client.getEmail(), null);
        return MembresiaResponse.from(membresia, plan.getNombre());
    }

    @Transactional
    public MembresiaResponse suspender(UserAccount caller, UUID membresiaId, String motivo) {
        Membresia membresia = membresiaRepository
                .findById(membresiaId)
                .orElseThrow(
                        () -> new BusinessException("NO_ENCONTRADO", "Membresía no encontrada", HttpStatus.NOT_FOUND));
        PlanMembresia plan = planRepository
                .findById(membresia.getPlanId())
                .orElseThrow(() -> new BusinessException("NO_ENCONTRADO", "Plan no encontrado", HttpStatus.NOT_FOUND));
        requireProviderOwner(caller, plan.getProviderId());
        if (membresia.getEstado() != MembresiaEstado.ACTIVA) {
            throw new BusinessException(
                    "TRANSICION_INVALIDA", "Solo se pueden suspender membresías activas", HttpStatus.CONFLICT);
        }
        membresia.setEstado(MembresiaEstado.SUSPENDIDA);
        membresia.setMotivo(motivo);
        membresiaRepository.save(membresia);
        auditLogger.record("Membresia", membresiaId.toString(), "SUSPENDIDA", caller.getEmail(), motivo);
        return MembresiaResponse.from(membresia, plan.getNombre());
    }

    @Transactional(readOnly = true)
    public List<MembresiaResponse> mis(UserAccount client) {
        LocalDate hoy = LocalDate.now();
        return membresiaRepository.findByClientIdOrderByFechaInicioDesc(client.getId()).stream()
                .map(m -> {
                    if (m.getEstado() == MembresiaEstado.ACTIVA
                            && m.getFechaFin().isBefore(hoy)) {
                        m.setEstado(MembresiaEstado.VENCIDA);
                        membresiaRepository.save(m);
                    }
                    String planNombre = planRepository
                            .findById(m.getPlanId())
                            .map(PlanMembresia::getNombre)
                            .orElse("");
                    return MembresiaResponse.from(m, planNombre);
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public List<MembresiaGestionResponse> gestion(UserAccount caller) {
        List<UUID> planIds;
        if (caller.getRole() == Role.ADMIN) {
            planIds = planRepository.findAll().stream().map(PlanMembresia::getId).toList();
        } else {
            UUID providerId = providerRepository
                    .findByUserId(caller.getId())
                    .map(Provider::getId)
                    .orElseThrow(() -> new BusinessException(
                            "PROVEEDOR_NO_ENCONTRADO", "Perfil de proveedor no encontrado", HttpStatus.NOT_FOUND));
            planIds = planRepository.findByProviderIdOrderByNombreAsc(providerId).stream()
                    .map(PlanMembresia::getId)
                    .toList();
        }
        if (planIds.isEmpty()) {
            return List.of();
        }
        List<Membresia> membresias = membresiaRepository.findAllByPlanIdInOrderByFechaInicioDesc(planIds);
        Map<UUID, String> nombresPlan = planRepository.findAllById(planIds).stream()
                .filter(p -> p.getId() != null)
                .collect(Collectors.toMap(PlanMembresia::getId, PlanMembresia::getNombre));
        Map<UUID, String> nombresCliente = userRepository
                .findAllById(membresias.stream().map(Membresia::getClientId).distinct().toList())
                .stream()
                .collect(Collectors.toMap(UserAccount::getId, UserAccount::getFullName));
        return membresias.stream()
                .map(m -> new MembresiaGestionResponse(
                        m.getId(),
                        m.getClientId(),
                        nombresCliente.getOrDefault(m.getClientId(), ""),
                        m.getPlanId(),
                        nombresPlan.getOrDefault(m.getPlanId(), ""),
                        m.getFechaInicio(),
                        m.getFechaFin(),
                        m.getEstado(),
                        m.getMotivo()))
                .toList();
    }

    @Transactional(readOnly = true)
    public BeneficioResponse beneficio(UserAccount client, BeneficioRequest request) {
        LocalDate hoy = LocalDate.now();
        Membresia activa = membresiaRepository
                .findFirstByClientIdAndEstadoOrderByFechaFinDesc(client.getId(), MembresiaEstado.ACTIVA)
                .filter(m -> !m.getFechaFin().isBefore(hoy))
                .orElse(null);
        if (activa == null) {
            return new BeneficioResponse(request.tarifa(), request.tarifa(), 0);
        }
        int pct = planRepository
                .findById(activa.getPlanId())
                .map(PlanMembresia::getDescuentoPorcentaje)
                .orElse(0);
        BigDecimal descuento = request.tarifa()
                .multiply(BigDecimal.valueOf(pct))
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        return new BeneficioResponse(request.tarifa(), request.tarifa().subtract(descuento), pct);
    }

    private UUID requireProviderId(UserAccount caller) {
        if (caller.getRole() == Role.ADMIN) {
            throw new BusinessException("ROL_INVALIDO", "El administrador no posee planes", HttpStatus.BAD_REQUEST);
        }
        return providerRepository
                .findByUserId(caller.getId())
                .map(Provider::getId)
                .orElseThrow(() -> new BusinessException(
                        "PROVEEDOR_NO_ENCONTRADO", "Perfil de proveedor no encontrado", HttpStatus.NOT_FOUND));
    }

    private void requireProviderOwner(UserAccount caller, UUID providerId) {
        if (caller.getRole() == Role.ADMIN) {
            return;
        }
        boolean owner = providerRepository
                .findByUserId(caller.getId())
                .map(p -> p.getId().equals(providerId))
                .orElse(false);
        if (!owner) {
            throw new BusinessException("FORBIDDEN", "No tiene permisos para esta operación", HttpStatus.FORBIDDEN);
        }
    }
}
