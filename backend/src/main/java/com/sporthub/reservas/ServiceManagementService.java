package com.sporthub.reservas;

import com.sporthub.infra.AuditLogger;
import com.sporthub.infra.BusinessException;
import com.sporthub.user.Role;
import com.sporthub.user.UserAccount;
import com.sporthub.user.UserRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ServiceManagementService {

    private final ProviderServiceRepository serviceRepository;
    private final ProviderRepository providerRepository;
    private final ProviderStaffRepository staffRepository;
    private final ServiceScheduleRepository scheduleRepository;
    private final UserRepository userRepository;
    private final AuditLogger auditLogger;

    public ServiceManagementService(
            ProviderServiceRepository serviceRepository,
            ProviderRepository providerRepository,
            ProviderStaffRepository staffRepository,
            ServiceScheduleRepository scheduleRepository,
            UserRepository userRepository,
            AuditLogger auditLogger) {
        this.serviceRepository = serviceRepository;
        this.providerRepository = providerRepository;
        this.staffRepository = staffRepository;
        this.scheduleRepository = scheduleRepository;
        this.userRepository = userRepository;
        this.auditLogger = auditLogger;
    }

    @Transactional
    public ServiceResponse createService(UserAccount caller, CreateServiceRequest request) {
        UUID providerId = resolveProviderId(caller, request.providerId());

        ProviderService service = new ProviderService(
                providerId,
                request.name(),
                request.description(),
                request.durationMinutes(),
                request.price(),
                request.active() != null ? request.active() : true);
        if (request.imageUrl() != null) {
            service.setImageUrl(request.imageUrl());
        }

        ProviderService saved = serviceRepository.save(service);
        String entityId = saved.getId() != null ? saved.getId().toString() : "";
        auditLogger.record("ProviderService", entityId, "CREADO", caller.getEmail(), saved.getName());
        return ServiceResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public List<ServiceResponse> listServices(UUID providerId) {
        if (providerId != null) {
            return serviceRepository.findByProviderIdOrderByNameAsc(providerId).stream()
                    .map(ServiceResponse::from)
                    .toList();
        }
        return serviceRepository.findAll().stream().map(ServiceResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<ServiceResponse> listServicesForProvider(UserAccount caller) {
        UUID providerId = resolveProviderId(caller, null);
        return serviceRepository.findByProviderIdOrderByNameAsc(providerId).stream()
                .map(ServiceResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public ServiceResponse getService(UUID id) {
        ProviderService service = serviceRepository
                .findById(id)
                .orElseThrow(() -> new BusinessException(
                        "SERVICIO_NO_ENCONTRADO", "Servicio no encontrado", HttpStatus.NOT_FOUND));
        return ServiceResponse.from(service);
    }

    @Transactional
    public ServiceResponse updateService(UserAccount caller, UUID id, UpdateServiceRequest request) {
        ProviderService service = serviceRepository
                .findById(id)
                .orElseThrow(() -> new BusinessException(
                        "SERVICIO_NO_ENCONTRADO", "Servicio no encontrado", HttpStatus.NOT_FOUND));

        validateProviderOwnership(caller, service.getProviderId());

        service.setName(request.name());
        service.setDescription(request.description());
        service.setDurationMinutes(request.durationMinutes());
        service.setPrice(request.price());
        if (request.active() != null) {
            service.setActive(request.active());
        }
        if (request.imageUrl() != null) {
            service.setImageUrl(request.imageUrl());
        }

        serviceRepository.save(service);
        auditLogger.record("ProviderService", id.toString(), "ACTUALIZADO", caller.getEmail(), service.getName());
        return ServiceResponse.from(service);
    }

    @Transactional
    public ServiceResponse toggleServiceActive(UserAccount caller, UUID id) {
        ProviderService service = serviceRepository
                .findById(id)
                .orElseThrow(() -> new BusinessException(
                        "SERVICIO_NO_ENCONTRADO", "Servicio no encontrado", HttpStatus.NOT_FOUND));

        validateProviderOwnership(caller, service.getProviderId());
        service.setActive(!service.isActive());
        serviceRepository.save(service);

        auditLogger.record(
                "ProviderService",
                id.toString(),
                service.isActive() ? "ACTIVADO" : "DESACTIVADO",
                caller.getEmail(),
                null);
        return ServiceResponse.from(service);
    }

    @Transactional
    public void deleteService(UserAccount caller, UUID id) {
        ProviderService service = serviceRepository
                .findById(id)
                .orElseThrow(() -> new BusinessException(
                        "SERVICIO_NO_ENCONTRADO", "Servicio no encontrado", HttpStatus.NOT_FOUND));

        validateProviderOwnership(caller, service.getProviderId());
        service.setActive(false);
        serviceRepository.save(service);

        auditLogger.record("ProviderService", id.toString(), "ELIMINADO_LOGICO", caller.getEmail(), null);
    }

    @Transactional(readOnly = true)
    public List<ScheduleResponse> listSchedules(UUID serviceId) {
        return scheduleRepository.findByProviderServiceId(serviceId).stream()
                .map(this::toScheduleResponse)
                .toList();
    }

    @Transactional
    public ScheduleResponse createSchedule(UserAccount caller, UUID serviceId, CreateScheduleRequest request) {
        ProviderService service = serviceRepository
                .findById(serviceId)
                .orElseThrow(() -> new BusinessException(
                        "SERVICIO_NO_ENCONTRADO", "Servicio no encontrado", HttpStatus.NOT_FOUND));

        validateProviderOwnership(caller, service.getProviderId());

        if (request.startTime().isAfter(request.endTime())
                || request.startTime().equals(request.endTime())) {
            throw new BusinessException(
                    "HORA_INVALIDA", "La hora de inicio debe ser anterior a la hora de fin", HttpStatus.BAD_REQUEST);
        }

        ProviderStaff staff = staffRepository
                .findById(request.staffId())
                .orElseThrow(() -> new BusinessException(
                        "PERSONAL_NO_ENCONTRADO", "Personal no encontrado", HttpStatus.NOT_FOUND));

        if (!staff.getProviderId().equals(service.getProviderId())) {
            throw new BusinessException(
                    "PERSONAL_INVALIDO", "El personal no pertenece a este proveedor", HttpStatus.BAD_REQUEST);
        }

        ServiceSchedule newSchedule = new ServiceSchedule(
                serviceId,
                service.getProviderId(),
                request.staffId(),
                request.dayOfWeek(),
                request.startTime(),
                request.endTime());

        // Validar superposición de horarios del mismo personal (HU-31)
        List<ServiceSchedule> staffSchedules = scheduleRepository.findByStaffId(request.staffId());
        boolean hasOverlap = staffSchedules.stream().anyMatch(existing -> existing.overlaps(newSchedule));
        if (hasOverlap) {
            throw new BusinessException(
                    "SUPERPOSICION_HORARIO",
                    "El personal ya tiene un horario asignado que se superpone con este rango",
                    HttpStatus.CONFLICT);
        }

        scheduleRepository.save(newSchedule);
        auditLogger.record("ServiceSchedule", newSchedule.getId().toString(), "CREADO", caller.getEmail(), null);
        return toScheduleResponse(newSchedule);
    }

    @Transactional
    public ScheduleResponse toggleScheduleBlocked(UserAccount caller, UUID scheduleId) {
        ServiceSchedule schedule = scheduleRepository
                .findById(scheduleId)
                .orElseThrow(() ->
                        new BusinessException("HORARIO_NO_ENCONTRADO", "Horario no encontrado", HttpStatus.NOT_FOUND));

        validateProviderOwnership(caller, schedule.getProviderId());
        schedule.setBlocked(!schedule.isBlocked());
        scheduleRepository.save(schedule);

        auditLogger.record(
                "ServiceSchedule",
                scheduleId.toString(),
                schedule.isBlocked() ? "BLOQUEADO" : "DESBLOQUEADO",
                caller.getEmail(),
                null);

        return toScheduleResponse(schedule);
    }

    @Transactional
    public void deleteSchedule(UserAccount caller, UUID scheduleId) {
        ServiceSchedule schedule = scheduleRepository
                .findById(scheduleId)
                .orElseThrow(() ->
                        new BusinessException("HORARIO_NO_ENCONTRADO", "Horario no encontrado", HttpStatus.NOT_FOUND));

        validateProviderOwnership(caller, schedule.getProviderId());
        scheduleRepository.delete(schedule);

        auditLogger.record("ServiceSchedule", scheduleId.toString(), "ELIMINADO", caller.getEmail(), null);
    }

    private ScheduleResponse toScheduleResponse(ServiceSchedule schedule) {
        String staffName = staffRepository
                .findById(schedule.getStaffId())
                .flatMap(s -> userRepository.findById(s.getUserId()))
                .map(UserAccount::getFullName)
                .orElse("Personal");
        return ScheduleResponse.of(schedule, staffName);
    }

    private UUID resolveProviderId(UserAccount caller, UUID explicitProviderId) {
        if (caller.getRole() == Role.ADMIN && explicitProviderId != null) {
            return explicitProviderId;
        }
        if (caller.getRole() == Role.PROVIDER) {
            return providerRepository
                    .findFirstByUserId(caller.getId())
                    .map(Provider::getId)
                    .orElseThrow(() -> new BusinessException(
                            "PROVEEDOR_NO_ENCONTRADO",
                            "No se encontró el perfil de proveedor para su usuario",
                            HttpStatus.NOT_FOUND));
        }
        if (caller.getRole() == Role.STAFF) {
            return staffRepository
                    .findFirstByUserId(caller.getId())
                    .map(ProviderStaff::getProviderId)
                    .orElseThrow(() -> new BusinessException(
                            "STAFF_NO_ASIGNADO", "No está asignado a ningún proveedor", HttpStatus.FORBIDDEN));
        }
        if (caller.getRole() == Role.ADMIN) {
            return providerRepository.findAll().stream()
                    .findFirst()
                    .map(Provider::getId)
                    .orElseThrow(() -> new BusinessException(
                            "PROVEEDOR_NO_ENCONTRADO", "No hay proveedores registrados", HttpStatus.BAD_REQUEST));
        }
        throw new BusinessException("ROL_NO_AUTORIZADO", "No tiene permisos de proveedor", HttpStatus.FORBIDDEN);
    }

    private void validateProviderOwnership(UserAccount caller, UUID providerId) {
        if (caller.getRole() == Role.ADMIN) {
            return;
        }
        boolean isOwner = providerRepository
                .findFirstByUserId(caller.getId())
                .map(p -> p.getId().equals(providerId))
                .orElse(false);
        if (!isOwner) {
            throw new BusinessException(
                    "FORBIDDEN", "No tienes permisos sobre este servicio o agenda", HttpStatus.FORBIDDEN);
        }
    }
}
