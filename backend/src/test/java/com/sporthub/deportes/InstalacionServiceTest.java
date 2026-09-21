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
import com.sporthub.user.Role;
import com.sporthub.user.UserAccount;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class InstalacionServiceTest {

    private InstalacionRepository instalacionRepository;
    private ReservaInstalacionRepository reservaRepository;
    private InstalacionMantenimientoRepository mantenimientoRepository;
    private ListaEsperaInstalacionRepository listaEsperaRepository;
    private com.sporthub.reservas.ProviderRepository providerRepository;
    private SportHubMetrics metrics;
    private InstalacionService service;

    private UserAccount cliente;
    private UUID instalacionId;

    @BeforeEach
    void setUp() {
        instalacionRepository = mock(InstalacionRepository.class);
        reservaRepository = mock(ReservaInstalacionRepository.class);
        mantenimientoRepository = mock(InstalacionMantenimientoRepository.class);
        listaEsperaRepository = mock(ListaEsperaInstalacionRepository.class);
        providerRepository = mock(com.sporthub.reservas.ProviderRepository.class);
        AuditLogger auditLogger = mock(AuditLogger.class);
        metrics = mock(SportHubMetrics.class);
        service = new InstalacionService(
                instalacionRepository,
                reservaRepository,
                mantenimientoRepository,
                listaEsperaRepository,
                providerRepository,
                auditLogger,
                metrics);

        instalacionId = UUID.randomUUID();
        cliente = mock(UserAccount.class);
        when(cliente.getId()).thenReturn(UUID.randomUUID());
        when(cliente.getEmail()).thenReturn("cliente@mail.com");
        when(cliente.getRole()).thenReturn(Role.CLIENT);
    }

    private Instalacion instalacion(int capacidad) {
        Instalacion i = new Instalacion(
                UUID.randomUUID(),
                TipoInstalacion.CANCHA,
                "Cancha sintética A",
                capacidad,
                new BigDecimal("80000.00"),
                LocalTime.of(6, 0),
                LocalTime.of(22, 0));
        i.setId(instalacionId);
        return i;
    }

    @Test
    @DisplayName("PU-06: reserva instalación en franja libre (HU-58)")
    void reservaFranjaLibre() {
        Instalacion instalacion = instalacion(2);
        when(instalacionRepository.findByIdAndActivaTrue(instalacionId)).thenReturn(Optional.of(instalacion));
        when(mantenimientoRepository.findByInstalacionIdAndFechaAndActivoTrue(any(), any()))
                .thenReturn(List.of());
        when(reservaRepository.findByInstalacionIdAndFechaAndEstadoIn(any(), any(), any()))
                .thenReturn(List.of());
        when(reservaRepository.save(any(ReservaInstalacion.class))).thenAnswer(invocation -> {
            ReservaInstalacion creada = invocation.getArgument(0);
            creada.setId(UUID.randomUUID());
            return creada;
        });

        LocalDate fecha = LocalDate.now().plusDays(1);
        ReservaInstalacionResponse response =
                service.reservar(cliente, instalacionId, new ReservarInstalacionRequest(fecha, LocalTime.of(10, 0)));

        assertThat(response.estado()).isEqualTo(ReservaInstalacionEstado.RESERVADA);
        assertThat(response.fecha()).isEqualTo(fecha);
        assertThat(response.instalacionId()).isEqualTo(instalacionId);
        verify(metrics).instalacionReservada();
    }

    @Test
    @DisplayName("PU-07: rechaza reserva por cupo lleno en la franja (RN-1)")
    void rechazaCupoLleno() {
        Instalacion instalacion = instalacion(1);
        when(instalacionRepository.findByIdAndActivaTrue(instalacionId)).thenReturn(Optional.of(instalacion));
        when(mantenimientoRepository.findByInstalacionIdAndFechaAndActivoTrue(any(), any()))
                .thenReturn(List.of());
        ReservaInstalacion ocupada = mock(ReservaInstalacion.class);
        when(ocupada.superpuesta(any(), any())).thenReturn(true);
        when(reservaRepository.findByInstalacionIdAndFechaAndEstadoIn(any(), any(), any()))
                .thenReturn(List.of(ocupada));

        assertThatThrownBy(() -> service.reservar(
                        cliente,
                        instalacionId,
                        new ReservarInstalacionRequest(LocalDate.now().plusDays(1), LocalTime.of(10, 0))))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo("CUPO_COMPLETO");
    }

    @Test
    @DisplayName("PU-08: rechaza reserva en franja en mantenimiento (HU-61)")
    void rechazaMantenimiento() {
        Instalacion instalacion = instalacion(2);
        when(instalacionRepository.findByIdAndActivaTrue(instalacionId)).thenReturn(Optional.of(instalacion));
        InstalacionMantenimiento mantenimiento = mock(InstalacionMantenimiento.class);
        when(mantenimiento.superpuesta(any(), any())).thenReturn(true);
        when(mantenimientoRepository.findByInstalacionIdAndFechaAndActivoTrue(any(), any()))
                .thenReturn(List.of(mantenimiento));

        assertThatThrownBy(() -> service.reservar(
                        cliente,
                        instalacionId,
                        new ReservarInstalacionRequest(LocalDate.now().plusDays(1), LocalTime.of(10, 0))))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo("HORARIO_BLOQUEADO");
    }

    @Test
    @DisplayName("PU-09: entra en lista de espera cuando la franja está completa (HU-62)")
    void entraListaEspera() {
        Instalacion instalacion = instalacion(1);
        when(instalacionRepository.findByIdAndActivaTrue(instalacionId)).thenReturn(Optional.of(instalacion));
        ReservaInstalacion ocupada = mock(ReservaInstalacion.class);
        when(ocupada.superpuesta(any(), any())).thenReturn(true);
        when(reservaRepository.findByInstalacionIdAndFechaAndEstadoIn(any(), any(), any()))
                .thenReturn(List.of(ocupada));
        when(listaEsperaRepository.existsByInstalacionIdAndClientIdAndFechaAndHoraInicioAndEstadoIn(
                        any(), any(), any(), any(), any()))
                .thenReturn(false);
        when(listaEsperaRepository.save(any(ListaEsperaInstalacion.class))).thenAnswer(invocation -> {
            ListaEsperaInstalacion creada = invocation.getArgument(0);
            creada.setId(UUID.randomUUID());
            return creada;
        });

        LocalDate fecha = LocalDate.now().plusDays(1);
        ListaEsperaResponse response = service.solicitarListaEspera(
                cliente, instalacionId, new SolicitarListaEsperaRequest(fecha, LocalTime.of(10, 0)));

        assertThat(response.estado()).isEqualTo(ListaEsperaEstado.EN_ESPERA);
        assertThat(response.instalacionId()).isEqualTo(instalacionId);
    }
}
