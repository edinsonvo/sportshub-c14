package com.sporthub.deportes;

import com.sporthub.infra.AuditLogger;
import com.sporthub.infra.BusinessException;
import com.sporthub.infra.SportHubMetrics;
import com.sporthub.reservas.Provider;
import com.sporthub.reservas.ProviderRepository;
import com.sporthub.user.Role;
import com.sporthub.user.UserAccount;
import com.sporthub.user.UserRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ImplementoService {

    private final ImplementoRepository implementoRepository;
    private final ReservaImplementoRepository reservaRepository;
    private final ProviderRepository providerRepository;
    private final UserRepository userRepository;
    private final AuditLogger auditLogger;
    private final SportHubMetrics metrics;

    public ImplementoService(
            ImplementoRepository implementoRepository,
            ReservaImplementoRepository reservaRepository,
            ProviderRepository providerRepository,
            UserRepository userRepository,
            AuditLogger auditLogger,
            SportHubMetrics metrics) {
        this.implementoRepository = implementoRepository;
        this.reservaRepository = reservaRepository;
        this.providerRepository = providerRepository;
        this.userRepository = userRepository;
        this.auditLogger = auditLogger;
        this.metrics = metrics;
    }

    @Transactional
    public ImplementoResponse registrar(UserAccount caller, CrearImplementoRequest request) {
        Implemento implemento = new Implemento(
                requireProviderId(caller), request.nombre(), request.tipo(), request.cantidadTotal(), request.tarifa());
        implementoRepository.save(implemento);
        auditLogger.record("Implemento", implemento.getId().toString(), "REGISTRADO", caller.getEmail(), null);
        return ImplementoResponse.from(implemento);
    }

    @Transactional(readOnly = true)
    public List<ImplementoResponse> listar(UserAccount caller) {
        List<Implemento> result;
        if (caller.getRole() == Role.ADMIN) {
            result = implementoRepository.findAll();
        } else if (caller.getRole() == Role.PROVIDER || caller.getRole() == Role.STAFF) {
            UUID providerId = providerRepository
                    .findFirstByUserId(caller.getId())
                    .map(Provider::getId)
                    .orElse(null);
            result = providerId != null
                    ? implementoRepository.findByProviderIdOrderByNombreAsc(providerId)
                    : implementoRepository.findByActivoTrueOrderByNombreAsc();
        } else {
            result = implementoRepository.findByActivoTrueOrderByNombreAsc();
        }
        return result.stream().map(ImplementoResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public int disponibilidad(UUID implementoId, LocalDate fecha) {
        Implemento implemento = requireActivo(implementoId);
        return implemento.getCantidadTotal() - enUso(implementoId, fecha);
    }

    @Transactional
    public ReservaImplementoResponse reservar(
            UserAccount client, UUID implementoId, ReservarImplementoRequest request) {
        Implemento implemento = requireActivo(implementoId);
        if (request.fecha().isBefore(LocalDate.now())) {
            throw new BusinessException("FECHA_PASADA", "La reserva no puede ser en el pasado", HttpStatus.BAD_REQUEST);
        }
        int disponible = implemento.getCantidadTotal() - enUso(implementoId, request.fecha());
        if (request.cantidad() > disponible) {
            throw new BusinessException(
                    "SIN_STOCK", "Stock insuficiente, quedan " + disponible + " unidades", HttpStatus.CONFLICT);
        }
        ReservaImplemento reserva =
                new ReservaImplemento(implementoId, client.getId(), request.fecha(), request.cantidad());
        reservaRepository.save(reserva);
        metrics.implementoReservado();
        auditLogger.record("ReservaImplemento", reserva.getId().toString(), "RESERVADA", client.getEmail(), null);
        return ReservaImplementoResponse.from(reserva);
    }

    @Transactional
    public ReservaImplementoResponse prestar(UserAccount caller, UUID reservaId) {
        ReservaImplemento reserva = requireReserva(reservaId);
        requireManager(caller, reserva.getImplementoId());
        if (reserva.getEstado() != ReservaImplementoEstado.RESERVADA) {
            throw new BusinessException(
                    "TRANSICION_INVALIDA", "Solo se pueden prestar implementos reservados", HttpStatus.CONFLICT);
        }
        reserva.setEstado(ReservaImplementoEstado.PRESTADO);
        reservaRepository.save(reserva);
        auditLogger.record("ReservaImplemento", reservaId.toString(), "PRESTADO", caller.getEmail(), null);
        return ReservaImplementoResponse.from(reserva);
    }

    @Transactional
    public ReservaImplementoResponse devolver(UserAccount caller, UUID reservaId, CondicionImplemento condicion) {
        ReservaImplemento reserva = requireReserva(reservaId);
        requireManager(caller, reserva.getImplementoId());
        if (reserva.getEstado() != ReservaImplementoEstado.PRESTADO) {
            throw new BusinessException(
                    "TRANSICION_INVALIDA", "Solo se pueden devolver implementos prestados", HttpStatus.CONFLICT);
        }
        if (condicion == CondicionImplemento.PERDIDO) {
            implementoRepository.findById(reserva.getImplementoId()).ifPresent(i -> {
                i.reducirStock(reserva.getCantidad());
                implementoRepository.save(i);
            });
        }
        reserva.setEstado(ReservaImplementoEstado.DEVUELTO);
        reserva.setCondicion(condicion);
        reservaRepository.save(reserva);
        auditLogger.record("ReservaImplemento", reservaId.toString(), "DEVUELTO", caller.getEmail(), condicion.name());
        return ReservaImplementoResponse.from(reserva);
    }

    @Transactional(readOnly = true)
    public List<ReservaImplementoResponse> mis(UserAccount client) {
        return reservaRepository.findByClientIdOrderByFechaDesc(client.getId()).stream()
                .map(ReservaImplementoResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ReservaImplementoGestionResponse> gestionReservas(UserAccount caller) {
        List<UUID> implementoIds;
        if (caller.getRole() == Role.ADMIN) {
            implementoIds = implementoRepository.findAll().stream()
                    .map(Implemento::getId)
                    .toList();
        } else {
            UUID providerId = providerRepository
                    .findFirstByUserId(caller.getId())
                    .map(Provider::getId)
                    .orElseThrow(() -> new BusinessException(
                            "PROVEEDOR_NO_ENCONTRADO", "Perfil de proveedor no encontrado", HttpStatus.NOT_FOUND));
            implementoIds = implementoRepository.findByProviderIdOrderByNombreAsc(providerId).stream()
                    .map(Implemento::getId)
                    .toList();
        }
        if (implementoIds.isEmpty()) {
            return List.of();
        }
        List<ReservaImplemento> reservas = reservaRepository.findAllByImplementoIdInOrderByFechaDesc(implementoIds);
        Map<UUID, String> nombresImplemento = implementoRepository.findAllById(implementoIds).stream()
                .collect(Collectors.toMap(Implemento::getId, Implemento::getNombre));
        Map<UUID, String> nombresCliente =
                userRepository
                        .findAllById(reservas.stream()
                                .map(ReservaImplemento::getClientId)
                                .distinct()
                                .toList())
                        .stream()
                        .collect(Collectors.toMap(UserAccount::getId, UserAccount::getFullName));
        return reservas.stream()
                .map(r -> new ReservaImplementoGestionResponse(
                        r.getId(),
                        r.getImplementoId(),
                        nombresImplemento.getOrDefault(r.getImplementoId(), ""),
                        r.getClientId(),
                        nombresCliente.getOrDefault(r.getClientId(), ""),
                        r.getFecha(),
                        r.getCantidad(),
                        r.getEstado(),
                        r.getCondicion()))
                .toList();
    }

    private int enUso(UUID implementoId, LocalDate fecha) {
        return reservaRepository
                .findByImplementoIdAndFechaAndEstadoIn(implementoId, fecha, ReservaImplementoEstado.EN_USO)
                .stream()
                .mapToInt(ReservaImplemento::getCantidad)
                .sum();
    }

    private Implemento requireActivo(UUID implementoId) {
        return implementoRepository
                .findByIdAndActivoTrue(implementoId)
                .orElseThrow(() -> new BusinessException(
                        "IMPLEMENTO_INACTIVO", "El implemento no existe o no está activo", HttpStatus.NOT_FOUND));
    }

    private ReservaImplemento requireReserva(UUID reservaId) {
        return reservaRepository
                .findById(reservaId)
                .orElseThrow(() -> new BusinessException(
                        "NO_ENCONTRADO", "Reserva de implemento no encontrada", HttpStatus.NOT_FOUND));
    }

    private void requireManager(UserAccount caller, UUID implementoId) {
        if (caller.getRole() == Role.ADMIN) {
            return;
        }
        Implemento implemento = implementoRepository
                .findById(implementoId)
                .orElseThrow(
                        () -> new BusinessException("NO_ENCONTRADO", "Implemento no encontrado", HttpStatus.NOT_FOUND));
        boolean owner = providerRepository
                .findFirstByUserId(caller.getId())
                .map(p -> p.getId().equals(implemento.getProviderId()))
                .orElse(false);
        if (!owner) {
            throw new BusinessException("FORBIDDEN", "No tiene permisos para esta operación", HttpStatus.FORBIDDEN);
        }
    }

    private UUID requireProviderId(UserAccount caller) {
        if (caller.getRole() == Role.ADMIN) {
            throw new BusinessException(
                    "ROL_INVALIDO", "El administrador no posee implementos", HttpStatus.BAD_REQUEST);
        }
        return providerRepository
                .findFirstByUserId(caller.getId())
                .map(Provider::getId)
                .orElseThrow(() -> new BusinessException(
                        "PROVEEDOR_NO_ENCONTRADO", "Perfil de proveedor no encontrado", HttpStatus.NOT_FOUND));
    }
}
