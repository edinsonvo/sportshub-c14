package com.sporthub.deportes;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.sporthub.infra.AuditLogger;
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

class MembresiaServiceTest {

    private PlanMembresiaRepository planRepository;
    private MembresiaRepository membresiaRepository;
    private ProviderRepository providerRepository;
    private SportHubMetrics metrics;
    private MembresiaService service;

    private UserAccount cliente;
    private PlanMembresia plan;

    @BeforeEach
    void setUp() {
        planRepository = mock(PlanMembresiaRepository.class);
        membresiaRepository = mock(MembresiaRepository.class);
        providerRepository = mock(ProviderRepository.class);
        AuditLogger auditLogger = mock(AuditLogger.class);
        metrics = mock(SportHubMetrics.class);
        service = new MembresiaService(
                planRepository,
                membresiaRepository,
                providerRepository,
                mock(UserRepository.class),
                auditLogger,
                metrics);

        UUID clientId = UUID.randomUUID();
        cliente = mock(UserAccount.class);
        when(cliente.getId()).thenReturn(clientId);
        when(cliente.getEmail()).thenReturn("cliente@mail.com");
        when(cliente.getRole()).thenReturn(Role.CLIENT);

        plan = new PlanMembresia(
                UUID.randomUUID(), "Mensual total", 30, 15, new BigDecimal("120000.00"), "Acceso con descuento");
        plan.setId(UUID.randomUUID());
        when(planRepository.findByIdAndActivoTrue(any())).thenReturn(Optional.of(plan));
        when(planRepository.findById(any())).thenReturn(Optional.of(plan));
    }

    @Test
    @DisplayName("PU-14: compra membresía nueva y queda ACTIVA (HU-70)")
    void compraMembresiaNueva() {
        when(membresiaRepository.findFirstByClientIdAndEstadoOrderByFechaFinDesc(any(), any()))
                .thenReturn(Optional.empty());
        when(membresiaRepository.save(any(Membresia.class))).thenAnswer(invocation -> {
            Membresia creada = invocation.getArgument(0);
            creada.setId(UUID.randomUUID());
            return creada;
        });

        MembresiaResponse response = service.comprar(cliente, new ComprarMembresiaRequest(UUID.randomUUID()));

        assertThat(response.estado()).isEqualTo(MembresiaEstado.ACTIVA);
        assertThat(response.planNombre()).isEqualTo("Mensual total");
        assertThat(response.fechaFin()).isEqualTo(LocalDate.now().plusDays(30));
    }

    @Test
    @DisplayName("PU-15: renueva membresía activa ampliando su vigencia (HU-71)")
    void renuevaActiva() {
        Membresia membresia = new Membresia(
                plan.getId(), cliente.getId(), LocalDate.now(), LocalDate.now().plusDays(5));
        when(membresiaRepository.findFirstByClientIdAndEstadoOrderByFechaFinDesc(any(), any()))
                .thenReturn(Optional.of(membresia));
        when(membresiaRepository.save(any(Membresia.class))).thenAnswer(invocation -> {
            Membresia creada = invocation.getArgument(0);
            creada.setId(UUID.randomUUID());
            return creada;
        });

        MembresiaResponse response = service.comprar(cliente, new ComprarMembresiaRequest(UUID.randomUUID()));

        assertThat(response.estado()).isEqualTo(MembresiaEstado.ACTIVA);
        assertThat(response.fechaFin()).isEqualTo(LocalDate.now().plusDays(35));
    }

    @Test
    @DisplayName("PU-16: aplica descuento de membresía en la tarifa (HU-69)")
    void aplicaDescuentoBeneficio() {
        Membresia activa = new Membresia(
                plan.getId(), cliente.getId(), LocalDate.now(), LocalDate.now().plusDays(20));
        when(membresiaRepository.findFirstByClientIdAndEstadoOrderByFechaFinDesc(any(), any()))
                .thenReturn(Optional.of(activa));

        BeneficioResponse response = service.beneficio(cliente, new BeneficioRequest(new BigDecimal("80000.00")));

        assertThat(response.descuentoPorcentaje()).isEqualTo(15);
        assertThat(response.tarifaOriginal()).isEqualByComparingTo("80000.00");
        assertThat(response.tarifaFinal()).isEqualByComparingTo("68000.00");
    }

    @Test
    @DisplayName("PU-17: proveedor gestiona las membresías vendidas con su plan (HU-70)")
    void gestionDelProveedor() {
        UUID providerId = UUID.randomUUID();
        Provider provider = mock(Provider.class);
        when(provider.getId()).thenReturn(providerId);
        UserAccount proveedor = mock(UserAccount.class);
        when(proveedor.getId()).thenReturn(UUID.randomUUID());
        when(proveedor.getRole()).thenReturn(Role.PROVIDER);
        when(providerRepository.findFirstByUserId(any())).thenReturn(Optional.of(provider));

        PlanMembresia plan2 =
                new PlanMembresia(providerId, "Pack anual", 365, 25, new BigDecimal("600000.00"), "Beneficios premium");
        when(planRepository.findByProviderIdOrderByNombreAsc(providerId)).thenReturn(List.of(plan, plan2));
        when(planRepository.findAllById(any())).thenReturn(List.of(plan, plan2));

        Membresia vendida = new Membresia(
                plan.getId(), cliente.getId(), LocalDate.now(), LocalDate.now().plusDays(30));
        when(membresiaRepository.findAllByPlanIdInOrderByFechaInicioDesc(any())).thenReturn(List.of(vendida));

        List<MembresiaGestionResponse> result = service.gestion(proveedor);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).planNombre()).isEqualTo("Mensual total");
        assertThat(result.get(0).clientId()).isEqualTo(cliente.getId());
    }
}
