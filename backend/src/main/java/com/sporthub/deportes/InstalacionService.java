package com.sporthub.deportes;

import com.sporthub.infra.AuditLogger;
import com.sporthub.infra.BusinessException;
import com.sporthub.infra.SportHubMetrics;
import com.sporthub.reservas.Provider;
import com.sporthub.reservas.ProviderRepository;
import com.sporthub.user.Role;
import com.sporthub.user.UserAccount;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class InstalacionService {

    private static final long DURACION_MINUTOS = 60;

    private final InstalacionRepository instalacionRepository;
    private final ReservaInstalacionRepository reservaRepository;
    private final InstalacionMantenimientoRepository mantenimientoRepository;
    private final ListaEsperaInstalacionRepository listaEsperaRepository;
    private final ProviderRepository providerRepository;
    private final AuditLogger auditLogger;
    private final SportHubMetrics metrics;

    public InstalacionService(
            InstalacionRepository instalacionRepository,
            ReservaInstalacionRepository reservaRepository,
            InstalacionMantenimientoRepository mantenimientoRepository,
            ListaEsperaInstalacionRepository listaEsperaRepository,
            ProviderRepository providerRepository,
            AuditLogger auditLogger,
            SportHubMetrics metrics) {
        this.instalacionRepository = instalacionRepository;
        this.reservaRepository = reservaRepository;
        this.mantenimientoRepository = mantenimientoRepository;
        this.listaEsperaRepository = listaEsperaRepository;
        this.providerRepository = providerRepository;
        this.auditLogger = auditLogger;
        this.metrics = metrics;
    }

    @Transactional
    public InstalacionResponse registrar(UserAccount caller, CrearInstalacionRequest request) {
        if (request.horaCierre().isBefore(request.horaApertura())) {
            throw new BusinessException(
                    "HORARIO_INVALIDO",
                    "La hora de cierre debe ser posterior a la hora de apertura",
                    HttpStatus.BAD_REQUEST);
        }
        Instalacion instalacion = new Instalacion(
                requireProviderId(caller),
                request.tipo(),
                request.nombre(),
                request.capacidad(),
                request.tarifaPorHora(),
                request.horaApertura(),
                request.horaCierre());
        instalacionRepository.save(instalacion);
        auditLogger.record("Instalacion", instalacion.getId().toString(), "REGISTRADA", caller.getEmail(), null);
        return InstalacionResponse.from(instalacion);
    }

    @Transactional(readOnly = true)
    public List<InstalacionResponse> listar(UserAccount caller) {
        List<Instalacion> result;
        if (caller.getRole() == Role.ADMIN) {
            result = instalacionRepository.findAll();
        } else if (caller.getRole() == Role.PROVIDER || caller.getRole() == Role.STAFF) {
            UUID providerId = providerRepository
                    .findFirstByUserId(caller.getId())
                    .map(Provider::getId)
                    .orElse(null);
            result = providerId != null
                    ? instalacionRepository.findByProviderIdOrderByNombreAsc(providerId)
                    : instalacionRepository.findByActivaTrueOrderByNombreAsc();
        } else {
            result = instalacionRepository.findByActivaTrueOrderByNombreAsc();
        }
        return result.stream().map(InstalacionResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<FranjaInstalacion> disponibilidad(UUID instalacionId, LocalDate fecha) {
        Instalacion instalacion = requireActiva(instalacionId);
        List<InstalacionMantenimiento> mantenimientos =
                mantenimientoRepository.findByInstalacionIdAndFechaAndActivoTrue(instalacionId, fecha);
        List<ReservaInstalacion> activas = reservaRepository.findByInstalacionIdAndFechaAndEstadoIn(
                instalacionId, fecha, ReservaInstalacionEstado.ACTIVAS);
        List<FranjaInstalacion> franjas = new ArrayList<>();
        LocalTime cursor = instalacion.getHoraApertura();
        while (cursor.plusMinutes(DURACION_MINUTOS).compareTo(instalacion.getHoraCierre()) <= 0) {
            LocalTime inicio = cursor;
            LocalTime fin = cursor.plusMinutes(DURACION_MINUTOS);
            boolean bloqueada = mantenimientos.stream().anyMatch(m -> m.superpuesta(inicio, fin));
            long ocupadas =
                    activas.stream().filter(r -> r.superpuesta(inicio, fin)).count();
            int disponibles = bloqueada ? 0 : Math.max(0, instalacion.getCapacidad() - Math.toIntExact(ocupadas));
            franjas.add(new FranjaInstalacion(inicio, fin, disponibles));
            cursor = fin;
        }
        return franjas;
    }

    @Transactional
    public ReservaInstalacionResponse reservar(
            UserAccount client, UUID instalacionId, ReservarInstalacionRequest request) {
        Instalacion instalacion = requireActiva(instalacionId);
        if (request.fecha().isBefore(LocalDate.now())) {
            throw new BusinessException("FECHA_PASADA", "La reserva no puede ser en el pasado", HttpStatus.BAD_REQUEST);
        }
        LocalTime fin = request.horaInicio().plusMinutes(DURACION_MINUTOS);
        if (!instalacion.dentroDeHorario(request.horaInicio(), fin)) {
            throw new BusinessException(
                    "HORARIO_NO_VALIDO", "La franja está fuera del horario de atención", HttpStatus.BAD_REQUEST);
        }
        boolean bloqueada =
                mantenimientoRepository
                        .findByInstalacionIdAndFechaAndActivoTrue(instalacionId, request.fecha())
                        .stream()
                        .anyMatch(m -> m.superpuesta(request.horaInicio(), fin));
        if (bloqueada) {
            throw new BusinessException(
                    "HORARIO_BLOQUEADO", "La instalación está en mantenimiento en esa franja", HttpStatus.CONFLICT);
        }
        long ocupadas = reservaRepository
                .findByInstalacionIdAndFechaAndEstadoIn(
                        instalacionId, request.fecha(), ReservaInstalacionEstado.ACTIVAS)
                .stream()
                .filter(r -> r.superpuesta(request.horaInicio(), fin))
                .count();
        if (ocupadas >= instalacion.getCapacidad()) {
            throw new BusinessException("CUPO_COMPLETO", "No hay cupo disponible en esa franja", HttpStatus.CONFLICT);
        }
        ReservaInstalacion reserva =
                new ReservaInstalacion(instalacionId, client.getId(), request.fecha(), request.horaInicio(), fin);
        reservaRepository.save(reserva);
        metrics.instalacionReservada();
        auditLogger.record("ReservaInstalacion", reserva.getId().toString(), "RESERVADA", client.getEmail(), null);
        return ReservaInstalacionResponse.from(reserva);
    }

    @Transactional
    public ReservaInstalacionResponse cancelarReserva(UserAccount caller, UUID reservaId) {
        ReservaInstalacion reserva = reservaRepository
                .findById(reservaId)
                .orElseThrow(
                        () -> new BusinessException("NO_ENCONTRADO", "Reserva no encontrada", HttpStatus.NOT_FOUND));
        requireCanManageOrClient(caller, reserva);
        if (reserva.getEstado() != ReservaInstalacionEstado.RESERVADA) {
            throw new BusinessException(
                    "TRANSICION_INVALIDA", "La reserva no está en un estado cancelable", HttpStatus.CONFLICT);
        }
        reserva.setEstado(ReservaInstalacionEstado.CANCELADA);
        reservaRepository.save(reserva);
        promoListaEspera(reserva);
        metrics.instalacionReservada();
        auditLogger.record("ReservaInstalacion", reservaId.toString(), "CANCELADA", caller.getEmail(), null);
        return ReservaInstalacionResponse.from(reserva);
    }

    @Transactional
    public MantenimientoInstalacionResponse bloquearMantenimiento(
            UserAccount caller, UUID instalacionId, BloquearInstalacionRequest request) {
        Instalacion instalacion = requireActiva(instalacionId);
        requireProviderOwner(caller, instalacion.getProviderId());
        if (!request.horaFin().isAfter(request.horaInicio())) {
            throw new BusinessException(
                    "HORARIO_INVALIDO", "La hora fin debe ser posterior a la hora inicio", HttpStatus.BAD_REQUEST);
        }
        InstalacionMantenimiento mantenimiento = new InstalacionMantenimiento(
                instalacionId, request.fecha(), request.horaInicio(), request.horaFin(), request.motivo());
        mantenimientoRepository.save(mantenimiento);
        auditLogger.record(
                "InstalacionMantenimiento",
                mantenimiento.getId().toString(),
                "BLOQUEADA",
                caller.getEmail(),
                request.motivo());
        return MantenimientoInstalacionResponse.from(mantenimiento);
    }

    @Transactional
    public ListaEsperaResponse solicitarListaEspera(
            UserAccount client, UUID instalacionId, SolicitarListaEsperaRequest request) {
        Instalacion instalacion = requireActiva(instalacionId);
        LocalTime fin = request.horaInicio().plusMinutes(DURACION_MINUTOS);
        long ocupadas = reservaRepository
                .findByInstalacionIdAndFechaAndEstadoIn(
                        instalacionId, request.fecha(), ReservaInstalacionEstado.ACTIVAS)
                .stream()
                .filter(r -> r.superpuesta(request.horaInicio(), fin))
                .count();
        if (ocupadas < instalacion.getCapacidad()) {
            throw new BusinessException(
                    "CUPO_DISPONIBLE", "Hay cupo en esa franja, puede reservarla directamente", HttpStatus.CONFLICT);
        }
        if (listaEsperaRepository.existsByInstalacionIdAndClientIdAndFechaAndHoraInicioAndEstadoIn(
                instalacionId,
                client.getId(),
                request.fecha(),
                request.horaInicio(),
                List.of(ListaEsperaEstado.EN_ESPERA))) {
            throw new BusinessException(
                    "YA_EN_LISTA_ESPERA", "Ya está en la lista de espera para esa franja", HttpStatus.CONFLICT);
        }
        ListaEsperaInstalacion espera =
                new ListaEsperaInstalacion(instalacionId, client.getId(), request.fecha(), request.horaInicio());
        listaEsperaRepository.save(espera);
        auditLogger.record("ListaEspera", espera.getId().toString(), "EN_ESPERA", client.getEmail(), null);
        return ListaEsperaResponse.from(espera);
    }

    @Transactional(readOnly = true)
    public List<ReservaInstalacionResponse> misReservas(UserAccount client) {
        return reservaRepository.findByClientIdOrderByFechaDesc(client.getId()).stream()
                .map(ReservaInstalacionResponse::from)
                .toList();
    }

    private void promoListaEspera(ReservaInstalacion liberada) {
        listaEsperaRepository
                .findFirstByInstalacionIdAndFechaAndHoraInicioAndEstadoOrderByCreatedAtAsc(
                        liberada.getInstalacionId(),
                        liberada.getFecha(),
                        liberada.getHoraInicio(),
                        ListaEsperaEstado.EN_ESPERA)
                .ifPresent(espera -> {
                    ReservaInstalacion promovida = new ReservaInstalacion(
                            espera.getInstalacionId(),
                            espera.getClientId(),
                            espera.getFecha(),
                            espera.getHoraInicio(),
                            liberada.getHoraFin());
                    reservaRepository.save(promovida);
                    espera.setEstado(ListaEsperaEstado.ACEPTADA);
                    listaEsperaRepository.save(espera);
                    auditLogger.record(
                            "ReservaInstalacion",
                            promovida.getId().toString(),
                            "RESERVADA_POR_LISTA_ESPERA",
                            espera.getClientId().toString(),
                            null);
                });
    }

    private Instalacion requireActiva(UUID instalacionId) {
        return instalacionRepository
                .findByIdAndActivaTrue(instalacionId)
                .orElseThrow(() -> new BusinessException(
                        "INSTALACION_INACTIVA", "La instalación no existe o no está activa", HttpStatus.NOT_FOUND));
    }

    private void requireCanManageOrClient(UserAccount caller, ReservaInstalacion reserva) {
        if (caller.getId().equals(reserva.getClientId())) {
            return;
        }
        Instalacion instalacion = instalacionRepository
                .findById(reserva.getInstalacionId())
                .orElseThrow(() ->
                        new BusinessException("NO_ENCONTRADO", "Instalación no encontrada", HttpStatus.NOT_FOUND));
        requireProviderOwner(caller, instalacion.getProviderId());
    }

    private UUID requireProviderId(UserAccount caller) {
        if (caller.getRole() == Role.ADMIN) {
            throw new BusinessException(
                    "ROL_INVALIDO", "El administrador no posee instalaciones", HttpStatus.BAD_REQUEST);
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
