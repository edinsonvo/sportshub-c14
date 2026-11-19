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
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
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


    // HU-39: registrar finalización solamente cuando haya terminado el servicio.
    private Appointment appointmentParaFinalizar(LocalDate date, AppointmentStatus status) {
        Appointment appointment = new Appointment(
                UUID.randomUUID(),
                UUID.randomUUID(),
                UUID.randomUUID(),
                UUID.randomUUID(),
                date,
                LocalTime.of(9, 0),
                LocalTime.of(10, 0));
        appointment.setStatus(status);
        return appointment;
    }

    private UserAccount administrador() {
        return new UserAccount("admin@mail.com", "hash", "Admin", null, Role.ADMIN);
    }

    @Test
    @DisplayName("HU-39: permite finalizar cita confirmada después de concluir y guarda la hora exacta")
    void completaCitaConcluidaYRegistraTimestamp() {
        UUID id = UUID.randomUUID();
        Appointment appointment = appointmentParaFinalizar(
                LocalDate.now(ZoneId.of("America/Bogota")).minusDays(1), AppointmentStatus.CONFIRMADA);
        when(appointmentRepository.findById(id)).thenReturn(Optional.of(appointment));
        when(appointmentRepository.save(appointment)).thenReturn(appointment);

        Instant before = Instant.now();
        AppointmentResponse response = service.markCompleted(administrador(), id);
        Instant after = Instant.now();

        assertThat(response.status()).isEqualTo(AppointmentStatus.COMPLETADA);
        assertThat(appointment.getCompletedAt()).isBetween(before, after);
        assertThat(response.completedAt()).isEqualTo(appointment.getCompletedAt());
    }

    @Test
    @DisplayName("HU-39: no permite finalizar una cita futura")
    void rechazaFinalizarCitaFutura() {
        UUID id = UUID.randomUUID();
        Appointment appointment = appointmentParaFinalizar(
                LocalDate.now(ZoneId.of("America/Bogota")).plusDays(1), AppointmentStatus.CONFIRMADA);
        when(appointmentRepository.findById(id)).thenReturn(Optional.of(appointment));

        assertThatThrownBy(() -> service.markCompleted(administrador(), id))
                .isInstanceOf(BusinessException.class)
                .satisfies(ex -> {
                    BusinessException error = (BusinessException) ex;
                    assertThat(error.getErrorCode()).isEqualTo("CITA_NO_CONCLUIDA");
                    assertThat(error.getMessage())
                            .isEqualTo("Se debe esperar a que la cita concluya para poder finalizarla");
                    assertThat(error.getStatus()).isEqualTo(HttpStatus.CONFLICT);
                });
        assertThat(appointment.getStatus()).isEqualTo(AppointmentStatus.CONFIRMADA);
        assertThat(appointment.getCompletedAt()).isNull();
    }

    @Test
    @DisplayName("HU-39: no se puede finalizar dos veces la misma cita")
    void rechazaFinalizacionDuplicada() {
        UUID id = UUID.randomUUID();
        Appointment appointment = appointmentParaFinalizar(
                LocalDate.now(ZoneId.of("America/Bogota")).minusDays(1), AppointmentStatus.COMPLETADA);
        when(appointmentRepository.findById(id)).thenReturn(Optional.of(appointment));

        assertThatThrownBy(() -> service.markCompleted(administrador(), id))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo("TRANSICION_INVALIDA");
        assertThat(appointment.getCompletedAt()).isNull();
    }

    @Test
    @DisplayName("HU-39: cliente sin permiso no puede finalizar una cita")
    void rechazaFinalizacionPorCliente() {
        UUID id = UUID.randomUUID();
        Appointment appointment = appointmentParaFinalizar(
                LocalDate.now(ZoneId.of("America/Bogota")).minusDays(1), AppointmentStatus.CONFIRMADA);
        when(appointmentRepository.findById(id)).thenReturn(Optional.of(appointment));

        assertThatThrownBy(() -> service.markCompleted(client, id))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo("FORBIDDEN");
        assertThat(appointment.getStatus()).isEqualTo(AppointmentStatus.CONFIRMADA);
    }
}
