package com.sporthub.reservas;

import com.sporthub.infra.AuditLogger;
import com.sporthub.infra.BusinessException;
import com.sporthub.infra.SportHubMetrics;
import com.sporthub.user.Role;
import com.sporthub.user.UserAccount;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AppointmentService {

    // Las fechas y horas de las citas se interpretan en horario colombiano.
    private static final ZoneId APPOINTMENT_ZONE = ZoneId.of("America/Bogota");

    private final AppointmentRepository appointmentRepository;
    private final ProviderServiceRepository serviceRepository;
    private final ServiceScheduleRepository scheduleRepository;
    private final ProviderRepository providerRepository;
    private final ProviderStaffRepository staffRepository;
    private final AvailabilityChecker availabilityChecker;
    private final AuditLogger auditLogger;
    private final SportHubMetrics metrics;

    public AppointmentService(
            AppointmentRepository appointmentRepository,
            ProviderServiceRepository serviceRepository,
            ServiceScheduleRepository scheduleRepository,
            ProviderRepository providerRepository,
            ProviderStaffRepository staffRepository,
            AvailabilityChecker availabilityChecker,
            AuditLogger auditLogger,
            SportHubMetrics metrics) {
        this.appointmentRepository = appointmentRepository;
        this.serviceRepository = serviceRepository;
        this.scheduleRepository = scheduleRepository;
        this.providerRepository = providerRepository;
        this.staffRepository = staffRepository;
        this.availabilityChecker = availabilityChecker;
        this.auditLogger = auditLogger;
        this.metrics = metrics;
    }

    @Transactional
    public AppointmentResponse create(UserAccount client, CreateAppointmentRequest request) {
        ProviderService service = serviceRepository
                .findByIdAndActiveTrue(request.serviceId())
                .orElseThrow(() -> new BusinessException(
                        "SERVICIO_INACTIVO", "El servicio no existe o no está activo", HttpStatus.NOT_FOUND));
        if (request.date().isBefore(LocalDate.now())) {
            throw new BusinessException("FECHA_PASADA", "La cita no puede ser en el pasado", HttpStatus.BAD_REQUEST);
        }
        LocalTime end = request.startTime().plusMinutes(service.getDurationMinutes());
        requireCoveredBySchedule(service.getId(), request.staffId(), request.date(), request.startTime(), end);
        if (availabilityChecker.hasConflict(request.staffId(), request.date(), request.startTime(), end)) {
            throw new BusinessException("HORARIO_OCUPADO", "El horario ya está reservado", HttpStatus.CONFLICT);
        }
        Appointment appointment = new Appointment(
                service.getId(),
                client.getId(),
                request.staffId(),
                service.getProviderId(),
                request.date(),
                request.startTime(),
                end);
        appointmentRepository.save(appointment);
        metrics.appointmentCreated();
        auditLogger.record("Appointment", appointment.getId().toString(), "SOLICITADA", client.getEmail(), null);
        return AppointmentResponse.from(appointment);
    }

    @Transactional
    public AppointmentResponse confirm(UserAccount caller, UUID appointmentId) {
        Appointment appointment = require(appointmentId);
        requireProviderAccess(caller, appointment);
        if (appointment.getStatus() != AppointmentStatus.SOLICITADA) {
            throw new BusinessException(
                    "TRANSICION_INVALIDA", "Solo se pueden confirmar citas en estado SOLICITADA", HttpStatus.CONFLICT);
        }
        appointment.setStatus(AppointmentStatus.CONFIRMADA);
        auditLogger.record("Appointment", appointmentId.toString(), "CONFIRMADA", caller.getEmail(), null);
        return AppointmentResponse.from(appointmentRepository.save(appointment));
    }

    @Transactional
    public AppointmentResponse reschedule(UserAccount caller, UUID appointmentId, RescheduleRequest request) {
        Appointment appointment = require(appointmentId);
        requireClientOrProviderAccess(caller, appointment);
        ProviderService service = serviceRepository
                .findByIdAndActiveTrue(appointment.getProviderServiceId())
                .orElseThrow(() -> new BusinessException(
                        "SERVICIO_INACTIVO", "El servicio ya no está activo", HttpStatus.CONFLICT));
        LocalTime newEnd = request.newStartTime().plusMinutes(service.getDurationMinutes());
        requireCoveredBySchedule(
                service.getId(), appointment.getStaffId(), request.newDate(), request.newStartTime(), newEnd);
        if (availabilityChecker.hasConflict(
                appointment.getStaffId(), request.newDate(), request.newStartTime(), newEnd)) {
            throw new BusinessException("HORARIO_OCUPADO", "El nuevo horario ya está reservado", HttpStatus.CONFLICT);
        }
        appointment.reschedule(request.newDate(), request.newStartTime(), newEnd);
        auditLogger.record("Appointment", appointmentId.toString(), "REPROGRAMADA", caller.getEmail(), null);
        return AppointmentResponse.from(appointmentRepository.save(appointment));
    }

    @Transactional
    public AppointmentResponse cancel(UserAccount caller, UUID appointmentId, CancelRequest cancelRequest) {
        Appointment appointment = require(appointmentId);
        requireClientOrProviderAccess(caller, appointment);
        if (!AppointmentStatus.ACTIVAS.contains(appointment.getStatus())) {
            throw new BusinessException(
                    "TRANSICION_INVALIDA", "La cita no está en un estado cancelable", HttpStatus.CONFLICT);
        }
        appointment.setStatus(AppointmentStatus.CANCELADA);
        appointment.setCancellationReason(cancelRequest != null ? cancelRequest.reason() : null);
        metrics.appointmentCancelled();
        auditLogger.record("Appointment", appointmentId.toString(), "CANCELADA", caller.getEmail(), null);
        return AppointmentResponse.from(appointmentRepository.save(appointment));
    }

    @Transactional
    public AppointmentResponse cancelByUnforeseen(UserAccount caller, UUID appointmentId, CancelRequest cancelRequest) {
        Appointment appointment = require(appointmentId);
        requireProviderAccess(caller, appointment);
        if (!AppointmentStatus.ACTIVAS.contains(appointment.getStatus())) {
            throw new BusinessException(
                    "TRANSICION_INVALIDA", "La cita no está en un estado cancelable", HttpStatus.CONFLICT);
        }
        appointment.setStatus(AppointmentStatus.CANCELADA_POR_IMPREVISTO);
        appointment.setCancellationReason(
                cancelRequest != null && cancelRequest.reason() != null
                        ? cancelRequest.reason()
                        : "Imprevisto del proveedor");
        metrics.appointmentCancelled();
        auditLogger.record(
                "Appointment", appointmentId.toString(), "CANCELADA_POR_IMPREVISTO", caller.getEmail(), null);
        return AppointmentResponse.from(appointmentRepository.save(appointment));
    }

    @Transactional
    public AppointmentResponse markCompleted(UserAccount caller, UUID appointmentId) {
        Appointment appointment = require(appointmentId);
        requireProviderAccess(caller, appointment);
        if (appointment.getStatus() != AppointmentStatus.CONFIRMADA) {
            throw new BusinessException(
                    "TRANSICION_INVALIDA", "Solo se pueden completar citas CONFIRMADAS", HttpStatus.CONFLICT);
        }
        // Solo puede finalizarse cuando el servicio ya concluyó, no cuando apenas inició.
        Instant finishedScheduledAt = appointment.getDate()
                .atTime(appointment.getEndTime())
                .atZone(APPOINTMENT_ZONE)
                .toInstant();
        Instant completedAt = Instant.now();
        if (completedAt.isBefore(finishedScheduledAt)) {
            throw new BusinessException(
                    "CITA_NO_CONCLUIDA",
                    "Se debe esperar a que la cita concluya para poder finalizarla",
                    HttpStatus.CONFLICT);
        }
        appointment.markCompleted(completedAt);
        auditLogger.record(
                "Appointment", appointmentId.toString(), "COMPLETADA", caller.getEmail(), "completedAt=" + completedAt);
        return AppointmentResponse.from(appointmentRepository.save(appointment));
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponse> listMine(
            UserAccount caller, AppointmentStatus status, LocalDate from, LocalDate to) {
        List<Appointment> result;
        if (caller.getRole() == Role.CLIENT) {
            result = appointmentRepository.findByClientIdOrderByDateDesc(caller.getId());
        } else if (caller.getRole() == Role.STAFF) {
            result = staffRepository
                    .findFirstByUserId(caller.getId())
                    .map(s -> appointmentRepository.findByStaffIdOrderByDateDesc(s.getId()))
                    .orElse(List.of());
        } else if (caller.getRole() == Role.PROVIDER) {
            result = providerRepository
                    .findFirstByUserId(caller.getId())
                    .map(p -> appointmentRepository.findByProviderIdOrderByDateDesc(p.getId()))
                    .orElse(List.of());
        } else {
            result = appointmentRepository.findAll();
        }
        return result.stream()
                .filter(a -> status == null || a.getStatus() == status)
                .filter(a -> from == null || !a.getDate().isBefore(from))
                .filter(a -> to == null || !a.getDate().isAfter(to))
                .map(AppointmentResponse::from)
                .toList();
    }

    public List<AvailabilityChecker.Slot> availability(UUID serviceId, LocalDate date) {
        return availabilityChecker.findSlots(serviceId, date);
    }

    private Appointment require(UUID appointmentId) {
        return appointmentRepository
                .findById(appointmentId)
                .orElseThrow(() -> new BusinessException("NO_ENCONTRADO", "Cita no encontrada", HttpStatus.NOT_FOUND));
    }

    private void requireCoveredBySchedule(
            UUID serviceId, UUID staffId, LocalDate date, LocalTime start, LocalTime end) {
        boolean covered =
                scheduleRepository
                        .findByProviderServiceIdAndDayOfWeekAndBlockedFalse(serviceId, date.getDayOfWeek())
                        .stream()
                        .anyMatch(s -> s.getStaffId().equals(staffId) && s.contains(start, end));
        if (!covered) {
            throw new BusinessException(
                    "HORARIO_NO_VALIDO",
                    "El horario solicitado no está dentro de la agenda del servicio",
                    HttpStatus.BAD_REQUEST);
        }
    }

    private void requireProviderAccess(UserAccount caller, Appointment appointment) {
        if (caller.getRole() == Role.ADMIN) {
            return;
        }
        boolean providerOwner = providerRepository
                .findFirstByUserId(caller.getId())
                .map(p -> p.getId().equals(appointment.getProviderId()))
                .orElse(false);
        boolean staffOfProvider = staffRepository
                .findFirstByUserId(caller.getId())
                .map(s -> s.getProviderId().equals(appointment.getProviderId()))
                .orElse(false);
        if (!providerOwner && !staffOfProvider) {
            throw new BusinessException("FORBIDDEN", "No tiene permisos para esta operación", HttpStatus.FORBIDDEN);
        }
    }

    private void requireClientOrProviderAccess(UserAccount caller, Appointment appointment) {
        if (caller.getId().equals(appointment.getClientId())) {
            return;
        }
        requireProviderAccess(caller, appointment);
    }
}
