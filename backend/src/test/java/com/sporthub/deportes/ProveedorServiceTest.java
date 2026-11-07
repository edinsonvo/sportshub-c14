package com.sporthub.deportes;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.sporthub.infra.BusinessException;
import com.sporthub.reservas.Provider;
import com.sporthub.reservas.ProviderRepository;
import com.sporthub.reservas.ProviderStaff;
import com.sporthub.reservas.ProviderStaffRepository;
import com.sporthub.user.Role;
import com.sporthub.user.UserAccount;
import com.sporthub.user.UserRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class ProveedorServiceTest {

    private ProviderRepository providerRepository;
    private ProviderStaffRepository staffRepository;
    private UserRepository userRepository;
    private ProveedorService service;

    private UserAccount proveedorUser;
    private UUID providerId;

    @BeforeEach
    void setUp() {
        providerRepository = mock(ProviderRepository.class);
        staffRepository = mock(ProviderStaffRepository.class);
        userRepository = mock(UserRepository.class);
        service = new ProveedorService(providerRepository, staffRepository, userRepository);

        providerId = UUID.randomUUID();
        proveedorUser = mock(UserAccount.class);
        when(proveedorUser.getId()).thenReturn(UUID.randomUUID());
        when(proveedorUser.getRole()).thenReturn(Role.PROVIDER);
    }

    @Test
    @DisplayName("PU-21: proveedor recupera su perfil y equipo de trabajo")
    void perfilProveedorConStaff() {
        Provider provider = mock(Provider.class);
        when(provider.getId()).thenReturn(providerId);
        when(provider.getBusinessName()).thenReturn("Deportes Fit S.A.S.");
        when(provider.getLogoUrl()).thenReturn(null);
        when(provider.isActive()).thenReturn(true);
        when(providerRepository.findFirstByUserId(any())).thenReturn(Optional.of(provider));
        when(providerRepository.findById(providerId)).thenReturn(Optional.of(provider));

        UUID staffUserId = UUID.randomUUID();
        ProviderStaff staff = new ProviderStaff(providerId, staffUserId, "Entrenador");
        UserAccount staffUser = mock(UserAccount.class);
        when(staffUser.getFullName()).thenReturn("Entrenador Demo");
        when(staffRepository.findByProviderId(providerId)).thenReturn(List.of(staff));
        when(userRepository.findById(staffUserId)).thenReturn(Optional.of(staffUser));

        ProveedorResponse response = service.me(proveedorUser);

        assertThat(response.providerId()).isEqualTo(providerId);
        assertThat(response.businessName()).isEqualTo("Deportes Fit S.A.S.");
        assertThat(response.staff()).hasSize(1);
        assertThat(response.staff().get(0).fullName()).isEqualTo("Entrenador Demo");
        assertThat(response.staff().get(0).posicion()).isEqualTo("Entrenador");
    }

    @Test
    @DisplayName("PU-22: un rol sin proveedor recibe error")
    void rolSinProveedorEsRechazado() {
        UserAccount cliente = mock(UserAccount.class);
        when(cliente.getRole()).thenReturn(Role.CLIENT);

        assertThatThrownBy(() -> service.me(cliente))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo("ROL_INVALIDO");
    }
}
