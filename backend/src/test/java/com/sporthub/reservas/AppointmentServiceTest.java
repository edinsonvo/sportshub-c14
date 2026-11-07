package com.sporthub.reservas;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.sporthub.infra.AuditLogger;
import com.sporthub.infra.BusinessException;
import com.sporthub.infra.SportHubMetrics;
import com.sporthub.user.Role;
import com.sporthub.user.UserAccount;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

class AppointmentServiceTest {

    private AppointmentRepository appointmentRepository;
    private ProviderServiceRepository serviceRepository;
    private ServiceScheduleRepository scheduleRepository;
    private ProviderRepository providerRepository;
    private ProviderStaffRepository staffRepository;
    private AvailabilityChecker availabilityChecker;
    private AppointmentService service;

    private UserAccount client;
    private ProviderService providerService;
    private ServiceSchedule schedule;

    @BeforeEach
    void setUp() {
        appointmentRepository = mock(AppointmentRepository.class);
        serviceRepository = mock(ProviderServiceRepository.class);
        scheduleRepository = mock(ServiceScheduleRepository.class);
        providerRepository = mock(ProviderRepository.class);
        staffRepository = mock(ProviderStaffRepository.class);
        availabilityChecker = mock(AvailabilityChecker.class);
        AuditLogger auditLogger = Mockito.mock(AuditLogger.class);
        SportHubMetrics metrics = Mockito.mock(SportHubMetrics.class);
        service = new AppointmentService(
                appointmentRepository,
                serviceRepository,
                scheduleRepository,
                providerRepository,
                staffRepository,
                availabilityChecker,
                auditLogger,
                metrics);

        UUID providerId = UUID.randomUUID();
        UUID staffId = UUID.randomUUID();
        client = new UserAccount("cliente@mail.com", "hash", "Cliente Uno", "3001112233", Role.CLIENT);
        providerService = mock(ProviderService.class);
        when(providerService.getId()).thenReturn(UUID.randomUUID());
        when(providerService.getProviderId()).thenReturn(providerId);
        when(providerService.getDurationMinutes()).thenReturn(60);

        schedule = mock(ServiceSchedule.class);
        when(schedule.getStaffId()).thenReturn(staffId);
        when(schedule.contains(any(), any())).thenReturn(true);
        when(scheduleRepository.findByProviderServiceIdAndDayOfWeekAndBlockedFalse(any(), any()))
                .thenReturn(List.of(schedule));
    }

    @Test
    @DisplayName("PU-01: crea reserva SOLICITADA en horario libre")
    void crearReservaValida() {
        when(serviceRepository.findByIdAndActiveTrue(any())).thenReturn(Optional.of(providerService));
        when(availabilityChecker.hasConflict(any(), any(), any(), any())).thenReturn(false);
        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(invocation -> {
            Appointment created = invocation.getArgument(0);
            created.setId(UUID.randomUUID());
            return created;
        });

        LocalDate targetDate = LocalDate.now().plusDays(1);
        CreateAppointmentRequest request = new CreateAppointmentRequest(
                providerService.getId(), schedule.getStaffId(), targetDate, LocalTime.of(9, 0));

        AppointmentResponse response = service.create(client, request);

        assertThat(response.status()).isEqualTo(AppointmentStatus.SOLICITADA);
        assertThat(response.staffId()).isEqualTo(schedule.getStaffId());
        assertThat(response.date()).isEqualTo(targetDate);
        assertThat(response.id()).isNotNull();
    }

    @Test
    @DisplayName("PU-02: rechaza reserva por superposición (RN-2)")
    void rechazaReservaOcupada() {
        when(serviceRepository.findByIdAndActiveTrue(any())).thenReturn(Optional.of(providerService));
        when(availabilityChecker.hasConflict(any(), any(), any(), any())).thenReturn(true);

        LocalDate targetDate = LocalDate.now().plusDays(1);
        CreateAppointmentRequest request = new CreateAppointmentRequest(
                providerService.getId(), schedule.getStaffId(), targetDate, LocalTime.of(9, 0));

        assertThatThrownBy(() -> service.create(client, request))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo("HORARIO_OCUPADO");
    }

    @Test
    @DisplayName("PU-03: no confirma una cita cancelada (transición inválida)")
    void noConfirmaCitaCancelada() {
        UUID appointmentId = UUID.randomUUID();
        Appointment cancelled = new Appointment(
                UUID.randomUUID(),
                UUID.randomUUID(),
                UUID.randomUUID(),
                UUID.randomUUID(),
                LocalDate.of(2026, 10, 1),
                LocalTime.of(9, 0),
                LocalTime.of(10, 0));
        cancelled.setStatus(AppointmentStatus.CANCELADA);
        when(appointmentRepository.findById(appointmentId)).thenReturn(Optional.of(cancelled));

        UserAccount admin = new UserAccount("admin@mail.com", "hash", "Admin", null, Role.ADMIN);

        assertThatThrownBy(() -> service.confirm(admin, appointmentId))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo("TRANSICION_INVALIDA");
    }

    @Test
    @DisplayName("PU-03b: confirma cita SOLICITADA")
    void confirmaCitaSolicitada() {
        UUID appointmentId = UUID.randomUUID();
        Appointment appointment = new Appointment(
                UUID.randomUUID(),
                UUID.randomUUID(),
                UUID.randomUUID(),
                UUID.randomUUID(),
                LocalDate.of(2026, 10, 1),
                LocalTime.of(9, 0),
                LocalTime.of(10, 0));
        when(appointmentRepository.findById(appointmentId)).thenReturn(Optional.of(appointment));
        when(appointmentRepository.save(appointment)).thenReturn(appointment);

        UserAccount admin = new UserAccount("admin@mail.com", "hash", "Admin", null, Role.ADMIN);
        AppointmentResponse response = service.confirm(admin, appointmentId);

        assertThat(response.status()).isEqualTo(AppointmentStatus.CONFIRMADA);
    }
}
