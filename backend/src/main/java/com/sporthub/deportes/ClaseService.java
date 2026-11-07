package com.sporthub.deportes;

import com.sporthub.infra.AuditLogger;
import com.sporthub.infra.BusinessException;
import com.sporthub.infra.SportHubMetrics;
import com.sporthub.reservas.Provider;
import com.sporthub.reservas.ProviderRepository;
import com.sporthub.reservas.ProviderStaffRepository;
import com.sporthub.user.Role;
import com.sporthub.user.UserAccount;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ClaseService {

    private final ClaseGrupalRepository claseRepository;
    private final InscripcionClaseRepository inscripcionRepository;
    private final InstalacionRepository instalacionRepository;
    private final ProviderRepository providerRepository;
    private final ProviderStaffRepository staffRepository;
    private final AuditLogger auditLogger;
    private final SportHubMetrics metrics;

    public ClaseService(
            ClaseGrupalRepository claseRepository,
            InscripcionClaseRepository inscripcionRepository,
            InstalacionRepository instalacionRepository,
            ProviderRepository providerRepository,
            ProviderStaffRepository staffRepository,
            AuditLogger auditLogger,
            SportHubMetrics metrics) {
        this.claseRepository = claseRepository;
        this.inscripcionRepository = inscripcionRepository;
        this.instalacionRepository = instalacionRepository;
        this.providerRepository = providerRepository;
        this.staffRepository = staffRepository;
        this.auditLogger = auditLogger;
        this.metrics = metrics;
    }

    @Transactional
    public ClaseResponse registrar(UserAccount caller, CrearClaseRequest request) {
        UUID providerId = requireProviderId(caller);
        instalacionRepository
                .findByIdAndActivaTrue(request.instalacionId())
                .orElseThrow(() -> new BusinessException(
                        "INSTALACION_INACTIVA", "La instalación no existe o no está activa", HttpStatus.NOT_FOUND));
        staffRepository
                .findById(request.entrenadorStaffId())
                .filter(s -> s.getProviderId().equals(providerId))
                .orElseThrow(() -> new BusinessException(
                        "STAFF_INVALIDO", "El entrenador no pertenece a su proveedor", HttpStatus.BAD_REQUEST));
        if (request.fecha().isBefore(LocalDate.now())) {
            throw new BusinessException("FECHA_PASADA", "La clase no puede ser en el pasado", HttpStatus.BAD_REQUEST);
        }
        ClaseGrupal clase = new ClaseGrupal(
                providerId,
                request.instalacionId(),
                request.entrenadorStaffId(),
                request.nombre(),
                request.nivel(),
                request.fecha(),
                request.hora(),
                request.duracionMin(),
                request.cupo());
        claseRepository.save(clase);
        auditLogger.record("ClaseGrupal", clase.getId().toString(), "REGISTRADA", caller.getEmail(), null);
        return ClaseResponse.from(clase, 0);
    }

    @Transactional
    public InscripcionClaseResponse inscribir(UserAccount client, UUID claseId) {
        ClaseGrupal clase = requireActiva(claseId);
        if (clase.getFecha().isBefore(LocalDate.now())) {
            throw new BusinessException("FECHA_PASADA", "La clase ya ocurrió", HttpStatus.BAD_REQUEST);
        }
        if (inscripcionRepository.existsByClaseGrupalIdAndClientIdAndEstadoIn(
                claseId, client.getId(), InscripcionEstado.ACTIVAS)) {
            throw new BusinessException(
                    "INSCRIPCION_DUPLICADA", "Ya tiene una inscripción activa en esta clase", HttpStatus.CONFLICT);
        }
        long confirmadas =
                inscripcionRepository.countByClaseGrupalIdAndEstadoIn(claseId, List.of(InscripcionEstado.CONFIRMADA));
        InscripcionClase inscripcion = new InscripcionClase(claseId, client.getId());
        inscripcion.setEstado(
                confirmadas < clase.getCupo() ? InscripcionEstado.CONFIRMADA : InscripcionEstado.EN_ESPERA);
        inscripcionRepository.save(inscripcion);
        metrics.claseInscrita();
        auditLogger.record(
                "InscripcionClase",
                inscripcion.getId().toString(),
                inscripcion.getEstado().name(),
                client.getEmail(),
                null);
        return InscripcionClaseResponse.from(inscripcion);
    }

    @Transactional
    public InscripcionClaseResponse cancelarInscripcion(UserAccount caller, UUID inscripcionId) {
        InscripcionClase inscripcion = inscripcionRepository
                .findById(inscripcionId)
                .orElseThrow(() ->
                        new BusinessException("NO_ENCONTRADO", "Inscripción no encontrada", HttpStatus.NOT_FOUND));
        ClaseGrupal clase = requireClase(inscripcion.getClaseGrupalId());
        requireClientOrManager(caller, clase, inscripcion);
        if (!InscripcionEstado.ACTIVAS.contains(inscripcion.getEstado())) {
            throw new BusinessException("TRANSICION_INVALIDA", "La inscripción ya no está activa", HttpStatus.CONFLICT);
        }
        boolean confirmada = inscripcion.getEstado() == InscripcionEstado.CONFIRMADA;
        if (confirmada) {
            LocalDateTime inicio = LocalDateTime.of(clase.getFecha(), clase.getHora());
            if (inicio.minusHours(24).isBefore(LocalDateTime.now())) {
                throw new BusinessException(
                        "VENTANA_CANCELACION",
                        "No se puede cancelar la inscripción dentro de las 24 horas previas",
                        HttpStatus.CONFLICT);
            }
        }
        inscripcion.setEstado(InscripcionEstado.CANCELADA);
        inscripcionRepository.save(inscripcion);
        auditLogger.record("InscripcionClase", inscripcionId.toString(), "CANCELADA", caller.getEmail(), null);
        if (confirmada) {
            promoListaEspera(clase.getId());
        }
        return InscripcionClaseResponse.from(inscripcion);
    }

    @Transactional(readOnly = true)
    public List<ClaseResponse> listar(UserAccount caller, UUID instalacionId) {
        List<ClaseGrupal> clases;
        if (caller.getRole() == Role.PROVIDER || caller.getRole() == Role.STAFF) {
            UUID providerId = providerRepository
                    .findFirstByUserId(caller.getId())
                    .map(Provider::getId)
                    .orElse(null);
            clases = providerId != null ? claseRepository.findByProviderIdOrderByFechaDesc(providerId) : List.of();
        } else if (instalacionId != null) {
            clases = claseRepository.findByInstalacionIdAndActivaTrueOrderByFechaAsc(instalacionId);
        } else {
            clases = claseRepository.findByActivaTrueOrderByFechaAsc();
        }
        return clases.stream()
                .map(c -> ClaseResponse.from(c, (int) inscripcionRepository.countByClaseGrupalIdAndEstadoIn(
                        c.getId(), List.of(InscripcionEstado.CONFIRMADA))))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<InscripcionClaseResponse> misInscripciones(UserAccount client) {
        return inscripcionRepository.findByClientIdOrderByCreatedAtDesc(client.getId()).stream()
                .map(InscripcionClaseResponse::from)
                .toList();
    }

    @Transactional
    public long completar(UserAccount caller, UUID claseId) {
        ClaseGrupal clase = requireActiva(claseId);
        requireProviderOwner(caller, clase.getProviderId());
        List<InscripcionClase> confirmadas = inscripcionRepository.findByClaseGrupalIdAndEstadoInOrderByCreatedAtAsc(
                claseId, List.of(InscripcionEstado.CONFIRMADA));
        confirmadas.forEach(i -> i.setEstado(InscripcionEstado.COMPLETADA));
        inscripcionRepository.saveAll(confirmadas);
        auditLogger.record("ClaseGrupal", claseId.toString(), "COMPLETADA", caller.getEmail(), null);
        return confirmadas.size();
    }

    private void promoListaEspera(UUID claseId) {
        inscripcionRepository
                .findFirstByClaseGrupalIdAndEstadoOrderByCreatedAtAsc(claseId, InscripcionEstado.EN_ESPERA)
                .ifPresent(espera -> {
                    espera.setEstado(InscripcionEstado.CONFIRMADA);
                    inscripcionRepository.save(espera);
                    auditLogger.record(
                            "InscripcionClase",
                            espera.getId().toString(),
                            "PROMOVIDA",
                            espera.getClientId().toString(),
                            null);
                });
    }

    private ClaseGrupal requireActiva(UUID claseId) {
        return claseRepository
                .findByIdAndActivaTrue(claseId)
                .orElseThrow(() -> new BusinessException(
                        "CLASE_INACTIVA", "La clase no existe o no está activa", HttpStatus.NOT_FOUND));
    }

    private ClaseGrupal requireClase(UUID claseId) {
        return claseRepository
                .findById(claseId)
                .orElseThrow(() -> new BusinessException("NO_ENCONTRADO", "Clase no encontrada", HttpStatus.NOT_FOUND));
    }

    private void requireClientOrManager(UserAccount caller, ClaseGrupal clase, InscripcionClase inscripcion) {
        if (caller.getId().equals(inscripcion.getClientId())) {
            return;
        }
        if (caller.getRole() == Role.ADMIN) {
            return;
        }
        boolean owner = providerRepository
                .findFirstByUserId(caller.getId())
                .map(p -> p.getId().equals(clase.getProviderId()))
                .orElse(false);
        boolean staff = staffRepository
                .findFirstByUserId(caller.getId())
                .map(s -> s.getProviderId().equals(clase.getProviderId()))
                .orElse(false);
        if (!owner && !staff) {
            throw new BusinessException("FORBIDDEN", "No tiene permisos para esta operación", HttpStatus.FORBIDDEN);
        }
    }

    private UUID requireProviderId(UserAccount caller) {
        if (caller.getRole() == Role.ADMIN) {
            throw new BusinessException("ROL_INVALIDO", "El administrador no posee clases", HttpStatus.BAD_REQUEST);
        }
        return providerRepository
                .findFirstByUserId(caller.getId())
                .map(Provider::getId)
                .orElseThrow(() -> new BusinessException(
                        "PROVEEDOR_NO_ENCONTRADO", "Perfil de proveedor no encontrado", HttpStatus.NOT_FOUND));
    }

    private void requireProviderOwner(UserAccount caller, UUID providerId) {
        if (caller.getRole() == Role.ADMIN) {
            return;
        }
        boolean owner = providerRepository
                .findFirstByUserId(caller.getId())
                .map(p -> p.getId().equals(providerId))
                .orElse(false);
        if (!owner) {
            throw new BusinessException("FORBIDDEN", "No tiene permisos para esta operación", HttpStatus.FORBIDDEN);
        }
    }
}
