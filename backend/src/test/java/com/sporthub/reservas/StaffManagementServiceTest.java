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
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;

class StaffManagementServiceTest {

    private ProviderStaffRepository staffRepository;
    private ProviderRepository providerRepository;
    private UserRepository userRepository;
    private AppointmentRepository appointmentRepository;
    private PasswordEncoder passwordEncoder;
    private AuditLogger auditLogger;
    private StaffManagementService service;

    private UserAccount providerUser;
    private Provider provider;

    @BeforeEach
    void setUp() {
        staffRepository = mock(ProviderStaffRepository.class);
        providerRepository = mock(ProviderRepository.class);
        userRepository = mock(UserRepository.class);
        appointmentRepository = mock(AppointmentRepository.class);
        passwordEncoder = mock(PasswordEncoder.class);
        auditLogger = mock(AuditLogger.class);

        service = new StaffManagementService(
                staffRepository,
                providerRepository,
                userRepository,
                appointmentRepository,
                passwordEncoder,
                auditLogger);

        UUID provUserId = UUID.randomUUID();
        UUID provId = UUID.randomUUID();
        providerUser = new UserAccount("prov@mail.com", "hash", "Prov Owner", null, Role.PROVIDER);
        providerUser.setId(provUserId);
        provider = new Provider(provUserId, "Gym Pro", "NIT-999");
        provider.setId(provId);
        when(providerRepository.findFirstByUserId(provUserId)).thenReturn(Optional.of(provider));
    }

    @Test
    @DisplayName("crea nuevo staff exitosamente")
    void crearStaffNuevo() {
        when(userRepository.findByEmail("entrenador@mail.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode(any())).thenReturn("hashed");
        when(staffRepository.existsByProviderIdAndUserId(any(), any())).thenReturn(false);
        when(staffRepository.save(any(ProviderStaff.class))).thenAnswer(inv -> {
            ProviderStaff s = inv.getArgument(0);
            s.setId(UUID.randomUUID());
            return s;
        });

        UserAccount staffUser =
                new UserAccount("entrenador@mail.com", "hashed", "Juan Perez", "3001234567", Role.STAFF);
        staffUser.setId(UUID.randomUUID());
        when(userRepository.save(any(UserAccount.class))).thenReturn(staffUser);

        CreateStaffRequest request =
                new CreateStaffRequest("entrenador@mail.com", "Juan Perez", "3001234567", "Entrenador", "password");

        StaffMemberResponse response = service.createStaff(providerUser, request);

        assertThat(response.email()).isEqualTo("entrenador@mail.com");
        assertThat(response.position()).isEqualTo("Entrenador");
    }

    @Test
    @DisplayName("rechaza duplicar staff en el mismo negocio")
    void rechazaStaffDuplicado() {
        UserAccount staffUser =
                new UserAccount("entrenador@mail.com", "hashed", "Juan Perez", "3001234567", Role.STAFF);
        when(userRepository.findByEmail("entrenador@mail.com")).thenReturn(Optional.of(staffUser));
        when(staffRepository.existsByProviderIdAndUserId(any(), any())).thenReturn(true);

        CreateStaffRequest request =
                new CreateStaffRequest("entrenador@mail.com", "Juan Perez", "3001234567", "Entrenador", "password");

        assertThatThrownBy(() -> service.createStaff(providerUser, request))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo("STAFF_DUPLICADO");
    }
}
