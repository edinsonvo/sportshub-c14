package com.sporthub.deportes;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.sporthub.infra.AuditLogger;
import com.sporthub.infra.BusinessException;
import com.sporthub.infra.SportHubMetrics;
import com.sporthub.reservas.ProviderRepository;
import com.sporthub.reservas.ProviderStaffRepository;
import com.sporthub.user.Role;
import com.sporthub.user.UserAccount;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class ClaseServiceTest {

    private ClaseGrupalRepository claseRepository;
    private InscripcionClaseRepository inscripcionRepository;
    private ProviderRepository providerRepository;
    private ClaseService service;

    private UserAccount cliente;
    private UUID claseId;

    @BeforeEach
    void setUp() {
        claseRepository = mock(ClaseGrupalRepository.class);
        inscripcionRepository = mock(InscripcionClaseRepository.class);
        InstalacionRepository instalacionRepository = mock(InstalacionRepository.class);
        providerRepository = mock(ProviderRepository.class);
        ProviderStaffRepository staffRepository = mock(ProviderStaffRepository.class);
        AuditLogger auditLogger = mock(AuditLogger.class);
        SportHubMetrics metrics = mock(SportHubMetrics.class);
        service = new ClaseService(
                claseRepository,
                inscripcionRepository,
                instalacionRepository,
                providerRepository,
                staffRepository,
                auditLogger,
                metrics);

        claseId = UUID.randomUUID();
        cliente = mock(UserAccount.class);
        when(cliente.getId()).thenReturn(UUID.randomUUID());
        when(cliente.getEmail()).thenReturn("cliente@mail.com");
    }

    private ClaseGrupal clase(int cupo) {
        return clase(cupo, LocalDate.now().plusDays(2));
    }

    private ClaseGrupal clase(int cupo, LocalDate fecha) {
        ClaseGrupal c = new ClaseGrupal(
                UUID.randomUUID(),
                UUID.randomUUID(),
                UUID.randomUUID(),
                "Entrenamiento funcional",
                "Intermedio",
                fecha,
                LocalTime.of(18, 0),
                60,
                cupo);
        c.setId(claseId);
        return c;
    }

    @Test
    @DisplayName("PU-10: inscribe confirmada cuando hay cupo (HU-65)")
    void inscribeConCupo() {
        ClaseGrupal clase = clase(12);
        when(claseRepository.findByIdAndActivaTrue(claseId)).thenReturn(Optional.of(clase));
        when(inscripcionRepository.existsByClaseGrupalIdAndClientIdAndEstadoIn(any(), any(), any()))
                .thenReturn(false);
        when(inscripcionRepository.countByClaseGrupalIdAndEstadoIn(any(), any()))
                .thenReturn(5L);
        when(inscripcionRepository.save(any(InscripcionClase.class))).thenAnswer(invocation -> {
            InscripcionClase creada = invocation.getArgument(0);
            creada.setId(UUID.randomUUID());
            return creada;
        });

        InscripcionClaseResponse response = service.inscribir(cliente, claseId);

        assertThat(response.estado()).isEqualTo(InscripcionEstado.CONFIRMADA);
        assertThat(response.claseGrupalId()).isEqualTo(claseId);
    }

    @Test
    @DisplayName("PU-11: pasa a lista de espera cuando el cupo está lleno (HU-66)")
    void inscribeEnEspera() {
        ClaseGrupal clase = clase(12);
        when(claseRepository.findByIdAndActivaTrue(claseId)).thenReturn(Optional.of(clase));
        when(inscripcionRepository.existsByClaseGrupalIdAndClientIdAndEstadoIn(any(), any(), any()))
                .thenReturn(false);
        when(inscripcionRepository.countByClaseGrupalIdAndEstadoIn(any(), any()))
                .thenReturn(12L);
        when(inscripcionRepository.save(any(InscripcionClase.class))).thenAnswer(invocation -> {
            InscripcionClase creada = invocation.getArgument(0);
            creada.setId(UUID.randomUUID());
            return creada;
        });

        InscripcionClaseResponse response = service.inscribir(cliente, claseId);

        assertThat(response.estado()).isEqualTo(InscripcionEstado.EN_ESPERA);
    }

    @Test
    @DisplayName("PU-12: rechaza inscripción duplicada activa (HU-67)")
    void rechazaDuplicada() {
        ClaseGrupal clase = clase(12);
        when(claseRepository.findByIdAndActivaTrue(claseId)).thenReturn(Optional.of(clase));
        when(inscripcionRepository.existsByClaseGrupalIdAndClientIdAndEstadoIn(any(), any(), any()))
                .thenReturn(true);

        assertThatThrownBy(() -> service.inscribir(cliente, claseId))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo("INSCRIPCION_DUPLICADA");
    }

    @Test
    @DisplayName("PU-13: no cancela inscripción confirmada dentro de las 24 h previas (HU-68)")
    void noCancelaVentana24h() {
        UUID clientId = UUID.randomUUID();
        ClaseGrupal clase = clase(12, LocalDate.now());
        when(claseRepository.findById(claseId)).thenReturn(Optional.of(clase));
        InscripcionClase inscripcion = new InscripcionClase(claseId, clientId);
        inscripcion.setEstado(InscripcionEstado.CONFIRMADA);
        when(inscripcionRepository.findById(any())).thenReturn(Optional.of(inscripcion));
        when(cliente.getRole()).thenReturn(Role.CLIENT);
        when(cliente.getId()).thenReturn(clientId);

        assertThatThrownBy(() -> service.cancelarInscripcion(cliente, UUID.randomUUID()))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo("VENTANA_CANCELACION");
    }
}
