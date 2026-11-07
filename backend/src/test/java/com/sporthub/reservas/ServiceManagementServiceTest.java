package com.sporthub.reservas;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.sporthub.infra.AuditLogger;
import com.sporthub.infra.BusinessException;
import com.sporthub.user.Role;
import com.sporthub.user.UserAccount;
import com.sporthub.user.UserRepository;
import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class ServiceManagementServiceTest {

    private ProviderServiceRepository serviceRepository;
    private ProviderRepository providerRepository;
    private ProviderStaffRepository staffRepository;
    private ServiceScheduleRepository scheduleRepository;
    private UserRepository userRepository;
    private AuditLogger auditLogger;
    private ServiceManagementService service;

    private UserAccount providerUser;
    private Provider provider;

    @BeforeEach
    void setUp() {
        serviceRepository = mock(ProviderServiceRepository.class);
        providerRepository = mock(ProviderRepository.class);
        staffRepository = mock(ProviderStaffRepository.class);
        scheduleRepository = mock(ServiceScheduleRepository.class);
        userRepository = mock(UserRepository.class);
        auditLogger = mock(AuditLogger.class);

        service = new ServiceManagementService(
                serviceRepository,
                providerRepository,
                staffRepository,
                scheduleRepository,
                userRepository,
                auditLogger);

        UUID provUserId = UUID.randomUUID();
        UUID provId = UUID.randomUUID();
        providerUser = new UserAccount("prov@mail.com", "hash", "Prov Owner", null, Role.PROVIDER);
        providerUser.setId(provUserId);
        provider = new Provider(provUserId, "Deportes Elite", "NIT-12345");
        provider.setId(provId);
        when(providerRepository.findByUserId(provUserId)).thenReturn(Optional.of(provider));
    }

    @Test
    @DisplayName("crea servicio exitosamente para el proveedor")
    void crearServicio() {
        when(serviceRepository.save(any(ProviderService.class))).thenAnswer(inv -> {
            ProviderService s = inv.getArgument(0);
            s.setId(UUID.randomUUID());
            return s;
        });

        CreateServiceRequest request = new CreateServiceRequest(
                null, "Corte de cabello", "Descripción", 45, new BigDecimal("35000.00"), true, null);

        ServiceResponse response = service.createService(providerUser, request);

        assertThat(response.name()).isEqualTo("Corte de cabello");
        assertThat(response.durationMinutes()).isEqualTo(45);
        assertThat(response.price()).isEqualByComparingTo("35000.00");
    }

    @Test
    @DisplayName("rechaza horario si hora inicio es posterior a fin")
    void rechazaHorarioInvalido() {
        UUID serviceId = UUID.randomUUID();
        ProviderService ps = new ProviderService(provider.getId(), "Corte", "Desc", 30, BigDecimal.TEN, true);
        when(serviceRepository.findById(serviceId)).thenReturn(Optional.of(ps));

        CreateScheduleRequest badSchedule =
                new CreateScheduleRequest(UUID.randomUUID(), DayOfWeek.MONDAY, LocalTime.of(18, 0), LocalTime.of(9, 0));

        assertThatThrownBy(() -> service.createSchedule(providerUser, serviceId, badSchedule))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo("HORA_INVALIDA");
    }

    @Test
    @DisplayName("toggleServiceActive invierte estado del servicio")
    void toggleServiceActive() {
        UUID serviceId = UUID.randomUUID();
        ProviderService ps = new ProviderService(provider.getId(), "Corte", "Desc", 30, BigDecimal.TEN, true);
        when(serviceRepository.findById(serviceId)).thenReturn(Optional.of(ps));

        ServiceResponse response = service.toggleServiceActive(providerUser, serviceId);
        assertThat(response.active()).isFalse();
    }
}
