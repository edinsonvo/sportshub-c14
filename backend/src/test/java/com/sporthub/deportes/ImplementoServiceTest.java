package com.sporthub.deportes;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.sporthub.infra.AuditLogger;
import com.sporthub.infra.BusinessException;
import com.sporthub.infra.SportHubMetrics;
import com.sporthub.reservas.Provider;
import com.sporthub.reservas.ProviderRepository;
import com.sporthub.user.Role;
import com.sporthub.user.UserAccount;
import com.sporthub.user.UserRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class ImplementoServiceTest {

    private ImplementoRepository implementoRepository;
    private ReservaImplementoRepository reservaRepository;
    private ProviderRepository providerRepository;
    private SportHubMetrics metrics;
    private ImplementoService service;

    private UserAccount cliente;
    private UUID implementoId;

    @BeforeEach
    void setUp() {
        implementoRepository = mock(ImplementoRepository.class);
        reservaRepository = mock(ReservaImplementoRepository.class);
        providerRepository = mock(ProviderRepository.class);
        AuditLogger auditLogger = mock(AuditLogger.class);
        metrics = mock(SportHubMetrics.class);
        service = new ImplementoService(
                implementoRepository,
                reservaRepository,
                providerRepository,
                mock(UserRepository.class),
                auditLogger,
                metrics);

        implementoId = UUID.randomUUID();
        cliente = mock(UserAccount.class);
        when(cliente.getId()).thenReturn(UUID.randomUUID());
        when(cliente.getEmail()).thenReturn("cliente@mail.com");
    }

    private Implemento implemento(int cantidad) {
        Implemento i =
                new Implemento(UUID.randomUUID(), "Balón de fútbol", "Balones", cantidad, new BigDecimal("10000.00"));
        i.setId(implementoId);
        return i;
    }

    @Test
    @DisplayName("PU-17: reserva implemento con stock disponible (HU-73)")
    void reservaConStock() {
        Implemento implemento = implemento(10);
        when(implementoRepository.findByIdAndActivoTrue(implementoId)).thenReturn(Optional.of(implemento));
        when(reservaRepository.findByImplementoIdAndFechaAndEstadoIn(any(), any(), any()))
                .thenReturn(List.of());
        when(reservaRepository.save(any(ReservaImplemento.class))).thenAnswer(invocation -> {
            ReservaImplemento creada = invocation.getArgument(0);
            creada.setId(UUID.randomUUID());
            return creada;
        });

        LocalDate fecha = LocalDate.now().plusDays(1);
        ReservaImplementoResponse response =
                service.reservar(cliente, implementoId, new ReservarImplementoRequest(fecha, 2));

        assertThat(response.estado()).isEqualTo(ReservaImplementoEstado.RESERVADA);
        assertThat(response.cantidad()).isEqualTo(2);
        assertThat(response.fecha()).isEqualTo(fecha);
        verify(metrics).implementoReservado();
    }

    @Test
    @DisplayName("PU-18: rechaza reserva por stock insuficiente (HU-74)")
    void rechazaSinStock() {
        Implemento implemento = implemento(10);
        when(implementoRepository.findByIdAndActivoTrue(implementoId)).thenReturn(Optional.of(implemento));
        ReservaImplemento enUso = mock(ReservaImplemento.class);
        when(enUso.getCantidad()).thenReturn(8);
        when(reservaRepository.findByImplementoIdAndFechaAndEstadoIn(any(), any(), any()))
                .thenReturn(List.of(enUso));

        assertThatThrownBy(() -> service.reservar(
                        cliente,
                        implementoId,
                        new ReservarImplementoRequest(LocalDate.now().plusDays(1), 3)))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo("SIN_STOCK");
    }

    @Test
    @DisplayName("PU-19: devolver como perdido reduce el stock (HU-75)")
    void devuelvePerdidoReduceStock() {
        Implemento implemento = implemento(10);
        when(implementoRepository.findByIdAndActivoTrue(implementoId)).thenReturn(Optional.of(implemento));
        ReservaImplemento reserva = new ReservaImplemento(implementoId, cliente.getId(), LocalDate.now(), 2);
        reserva.setEstado(ReservaImplementoEstado.PRESTADO);
        when(reservaRepository.findById(any())).thenReturn(Optional.of(reserva));
        when(implementoRepository.findById(implementoId)).thenReturn(Optional.of(implemento));

        UserAccount admin = mock(UserAccount.class);
        when(admin.getRole()).thenReturn(Role.ADMIN);

        ReservaImplementoResponse response = service.devolver(admin, UUID.randomUUID(), CondicionImplemento.PERDIDO);

        assertThat(response.estado()).isEqualTo(ReservaImplementoEstado.DEVUELTO);
        assertThat(response.condicion()).isEqualTo(CondicionImplemento.PERDIDO);
        assertThat(implemento.getCantidadTotal()).isEqualTo(8);
        verify(implementoRepository).save(implemento);
    }

    @Test
    @DisplayName("PU-20: proveedor consulta reservas de sus implementos para préstamo (HU-72/HU-73)")
    void gestionReservasDelProveedor() {
        UUID providerId = UUID.randomUUID();
        Provider provider = mock(Provider.class);
        when(provider.getId()).thenReturn(providerId);
        UserAccount proveedor = mock(UserAccount.class);
        when(proveedor.getId()).thenReturn(UUID.randomUUID());
        when(proveedor.getRole()).thenReturn(Role.PROVIDER);
        when(providerRepository.findFirstByUserId(any())).thenReturn(Optional.of(provider));
        when(implementoRepository.findByProviderIdOrderByNombreAsc(providerId)).thenReturn(List.of(implemento(10)));
        when(implementoRepository.findAllById(any())).thenReturn(List.of(implemento(10)));

        ReservaImplemento reserva = new ReservaImplemento(
                implementoId, cliente.getId(), LocalDate.now().plusDays(1), 2);
        when(reservaRepository.findAllByImplementoIdInOrderByFechaDesc(any())).thenReturn(List.of(reserva));

        List<ReservaImplementoGestionResponse> result = service.gestionReservas(proveedor);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).implementoNombre()).isEqualTo("Balón de fútbol");
        assertThat(result.get(0).clientId()).isEqualTo(cliente.getId());
        assertThat(result.get(0).estado()).isEqualTo(ReservaImplementoEstado.RESERVADA);
    }
}
