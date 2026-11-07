package com.sporthub.admin;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.sporthub.deportes.ClaseGrupalRepository;
import com.sporthub.deportes.InstalacionRepository;
import com.sporthub.deportes.TorneoRepository;
import com.sporthub.infra.AuditLogRepository;
import com.sporthub.infra.AuditLogger;
import com.sporthub.infra.BusinessException;
import com.sporthub.reservas.Appointment;
import com.sporthub.reservas.AppointmentRepository;
import com.sporthub.reservas.AppointmentStatus;
import com.sporthub.reservas.Provider;
import com.sporthub.reservas.ProviderRepository;
import com.sporthub.reservas.ProviderServiceRepository;
import com.sporthub.reservas.ProviderStaffRepository;
import com.sporthub.user.Role;
import com.sporthub.user.UserAccount;
import com.sporthub.user.UserRepository;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class AdminServiceTest {

    private UserRepository userRepository;
    private ProviderRepository providerRepository;
    private ProviderStaffRepository staffRepository;
    private ProviderServiceRepository serviceRepository;
    private AppointmentRepository appointmentRepository;
    private InstalacionRepository instalacionRepository;
    private ClaseGrupalRepository claseRepository;
    private TorneoRepository torneoRepository;
    private AuditLogRepository auditLogRepository;
    private AuditLogger auditLogger;
    private AdminService adminService;

    private UserAccount admin;
    private UserAccount client;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        providerRepository = mock(ProviderRepository.class);
        staffRepository = mock(ProviderStaffRepository.class);
        serviceRepository = mock(ProviderServiceRepository.class);
        appointmentRepository = mock(AppointmentRepository.class);
        instalacionRepository = mock(InstalacionRepository.class);
        claseRepository = mock(ClaseGrupalRepository.class);
        torneoRepository = mock(TorneoRepository.class);
        auditLogRepository = mock(AuditLogRepository.class);
        auditLogger = mock(AuditLogger.class);

        adminService = new AdminService(
                userRepository,
                providerRepository,
                staffRepository,
                serviceRepository,
                appointmentRepository,
                instalacionRepository,
                claseRepository,
                torneoRepository,
                auditLogRepository,
                auditLogger);

        admin = new UserAccount("admin@mail.com", "hash", "Admin", null, Role.ADMIN);
        admin.setId(UUID.randomUUID());
        client = new UserAccount("client@mail.com", "hash", "Cliente Uno", null, Role.CLIENT);
        client.setId(UUID.randomUUID());
    }

    @Test
    @DisplayName("lista usuarios filtrando por rol")
    void listUsersFiltrado() {
        when(userRepository.findAll()).thenReturn(List.of(admin, client));

        List<AdminUserResponse> clients = adminService.listUsers(Role.CLIENT, null);
        assertThat(clients).hasSize(1);
        assertThat(clients.get(0).email()).isEqualTo("client@mail.com");
    }

    @Test
    @DisplayName("toggleUserActive cambia el estado del usuario")
    void toggleUserActive() {
        UUID clientId = UUID.randomUUID();
        when(userRepository.findById(clientId)).thenReturn(Optional.of(client));

        AdminUserResponse response = adminService.toggleUserActive(admin, clientId);
        assertThat(response.active()).isFalse();
    }

    @Test
    @DisplayName("no permite desactivar la propia cuenta del admin")
    void noDesactivaAdminSelf() {
        assertThatThrownBy(() -> adminService.toggleUserActive(admin, admin.getId()))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo("ACCION_INVALIDA");
    }

    @Test
    @DisplayName("verifica identidad del proveedor correctamente")
    void verifyProvider() {
        UUID providerId = UUID.randomUUID();
        Provider provider = new Provider(UUID.randomUUID(), "Mi Negocio", "12345");
        when(providerRepository.findById(providerId)).thenReturn(Optional.of(provider));
        when(staffRepository.findByProviderId(any())).thenReturn(List.of());
        when(serviceRepository.findByProviderIdOrderByNameAsc(any())).thenReturn(List.of());

        AdminProviderResponse response = adminService.verifyProvider(admin, providerId, true);
        assertThat(response.identityVerified()).isTrue();
    }

    @Test
    @DisplayName("calcula estadísticas generales del sistema")
    void getStats() {
        when(userRepository.findAll()).thenReturn(List.of(admin, client));
        when(providerRepository.count()).thenReturn(1L);
        when(staffRepository.count()).thenReturn(2L);

        Appointment app = new Appointment(
                UUID.randomUUID(),
                client.getId(),
                UUID.randomUUID(),
                UUID.randomUUID(),
                LocalDate.now(),
                LocalTime.of(10, 0),
                LocalTime.of(11, 0));
        app.setStatus(AppointmentStatus.COMPLETADA);
        when(appointmentRepository.findAll()).thenReturn(List.of(app));

        SystemStatsResponse stats = adminService.getStats();
        assertThat(stats.totalUsers()).isEqualTo(2);
        assertThat(stats.totalClients()).isEqualTo(1);
        assertThat(stats.completedAppointments()).isEqualTo(1);
    }
}
