package com.sporthub.deportes;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.sporthub.infra.AuditLogger;
import com.sporthub.infra.BusinessException;
import com.sporthub.infra.SportHubMetrics;
import com.sporthub.reservas.Provider;
import com.sporthub.reservas.ProviderRepository;
import com.sporthub.user.Role;
import com.sporthub.user.UserAccount;
import com.sporthub.user.UserRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class TorneoServiceTest {

    private TorneoRepository torneoRepository;
    private ParticipanteTorneoRepository participanteRepository;
    private PartidoTorneoRepository partidoRepository;
    private TorneoService service;

    private UUID torneoId;
    private Torneo torneo;
    private UserAccount proveedor;

    @BeforeEach
    void setUp() {
        torneoRepository = mock(TorneoRepository.class);
        participanteRepository = mock(ParticipanteTorneoRepository.class);
        partidoRepository = mock(PartidoTorneoRepository.class);
        ProviderRepository providerRepository = mock(ProviderRepository.class);
        UserRepository userRepository = mock(UserRepository.class);
        AuditLogger auditLogger = mock(AuditLogger.class);
        SportHubMetrics metrics = mock(SportHubMetrics.class);
        service = new TorneoService(
                torneoRepository,
                participanteRepository,
                partidoRepository,
                providerRepository,
                userRepository,
                auditLogger,
                metrics);

        UUID providerId = UUID.randomUUID();
        torneoId = UUID.randomUUID();
        torneo = new Torneo(
                providerId,
                "Copa SportHub F5",
                "Fútbol 5",
                FormatoTorneo.ELIMINATORIA_DIRECTA,
                LocalDate.now().plusDays(7),
                LocalDate.now().plusDays(21),
                8);
        torneo.setId(torneoId);
        when(torneoRepository.findById(torneoId)).thenReturn(Optional.of(torneo));

        UUID userId = UUID.randomUUID();
        proveedor = mock(UserAccount.class);
        when(proveedor.getId()).thenReturn(userId);
        when(proveedor.getEmail()).thenReturn("deportes@sporthub.co");
        when(proveedor.getRole()).thenReturn(Role.PROVIDER);
        Provider provider = mock(Provider.class);
        when(provider.getId()).thenReturn(providerId);
        when(providerRepository.findByUserId(userId)).thenReturn(Optional.of(provider));
    }

    private ParticipanteTorneo participante(UUID id, String equipo) {
        ParticipanteTorneo p = new ParticipanteTorneo(torneoId, UUID.randomUUID(), equipo);
        p.setId(id);
        p.setEstado(ParticipanteEstado.CONFIRMADO);
        return p;
    }

    @Test
    @DisplayName("PU-20: inscribe participante confirmado en torneo abierto (HU-75)")
    void inscribeConfirmado() {
        when(participanteRepository.existsByTorneoIdAndClientId(any(), any())).thenReturn(false);
        when(participanteRepository.countByTorneoIdAndEstado(any(), any())).thenReturn(4L);
        when(participanteRepository.save(any(ParticipanteTorneo.class))).thenAnswer(invocation -> {
            ParticipanteTorneo creado = invocation.getArgument(0);
            creado.setId(UUID.randomUUID());
            return creado;
        });

        ParticipanteResponse response = service.inscribir(proveedor, torneoId, new InscribirTorneoRequest("Rayo FC"));

        assertThat(response.estado()).isEqualTo(ParticipanteEstado.CONFIRMADO);
        assertThat(response.torneoId()).isEqualTo(torneoId);
    }

    @Test
    @DisplayName("PU-21: rechaza inscripción cuando el cupo está completo (HU-76)")
    void rechazaCupoCompleto() {
        when(participanteRepository.existsByTorneoIdAndClientId(any(), any())).thenReturn(false);
        when(participanteRepository.countByTorneoIdAndEstado(any(), any())).thenReturn(8L);

        assertThatThrownBy(() -> service.inscribir(proveedor, torneoId, new InscribirTorneoRequest("Rayo FC")))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo("CUPO_COMPLETO");
    }

    @Test
    @DisplayName("PU-22: abrir torneo exige número par de participantes (HU-76)")
    void abreRequierePar() {
        ParticipanteTorneo a = participante(UUID.randomUUID(), "Equipo A");
        ParticipanteTorneo b = participante(UUID.randomUUID(), "Equipo B");
        ParticipanteTorneo c = participante(UUID.randomUUID(), "Equipo C");
        when(participanteRepository.findByTorneoIdAndEstadoOrderByCreatedAtAsc(any(), any()))
                .thenReturn(List.of(a, b, c));

        assertThatThrownBy(() -> service.abrir(proveedor, torneoId))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo("NUMERO_PAR_REQUERIDO");
    }

    @Test
    @DisplayName("PU-23: ranking de liga suma 3 puntos por victoria y 1 por empate (HU-76)")
    void rankingLiga() {
        ParticipanteTorneo a = participante(UUID.randomUUID(), "Equipo A");
        ParticipanteTorneo b = participante(UUID.randomUUID(), "Equipo B");
        ParticipanteTorneo c = participante(UUID.randomUUID(), "Equipo C");
        ParticipanteTorneo d = participante(UUID.randomUUID(), "Equipo D");
        when(participanteRepository.findByTorneoIdAndEstadoOrderByCreatedAtAsc(any(), any()))
                .thenReturn(List.of(a, b, c, d));

        Torneo liga = new Torneo(
                torneo.getProviderId(),
                "Liga SportHub",
                "Indoor",
                FormatoTorneo.LIGA,
                LocalDate.now().plusDays(7),
                LocalDate.now().plusDays(21),
                8);
        torneoId = UUID.randomUUID();
        liga.setId(torneoId);
        when(torneoRepository.findById(torneoId)).thenReturn(Optional.of(liga));

        PartidoTorneo p1 = new PartidoTorneo(torneoId, 1, a.getId(), b.getId(), liga.getFechaInicio());
        p1.registrarResultado(2, 0);
        PartidoTorneo p2 = new PartidoTorneo(torneoId, 1, c.getId(), d.getId(), liga.getFechaInicio());
        p2.registrarResultado(1, 1);
        PartidoTorneo p3 = new PartidoTorneo(torneoId, 2, a.getId(), c.getId(), liga.getFechaInicio());
        p3.registrarResultado(1, 3);
        PartidoTorneo p4 = new PartidoTorneo(torneoId, 2, b.getId(), d.getId(), liga.getFechaInicio());
        p4.registrarResultado(2, 1);
        when(partidoRepository.findByTorneoIdAndEstadoOrderByRondaAsc(any(), any()))
                .thenReturn(List.of(p1, p2, p3, p4));

        List<RankingEntry> ranking = service.ranking(torneoId);

        assertThat(ranking).hasSize(4);
        assertThat(ranking.get(0).nombre()).isEqualTo("Equipo C");
        assertThat(ranking.get(0).puntos()).isEqualTo(4);
        assertThat(ranking.get(3).nombre()).isEqualTo("Equipo D");
        assertThat(ranking.get(3).puntos()).isEqualTo(1);
    }

    @Test
    @DisplayName("PU-24: registrar resultado define al ganador del partido (HU-76)")
    void registraResultado() {
        ParticipanteTorneo a = participante(UUID.randomUUID(), "Equipo A");
        ParticipanteTorneo b = participante(UUID.randomUUID(), "Equipo B");
        PartidoTorneo partido = new PartidoTorneo(torneoId, 1, a.getId(), b.getId(), torneo.getFechaInicio());
        partido.setId(UUID.randomUUID());
        when(partidoRepository.findById(any())).thenReturn(Optional.of(partido));

        PartidoResponse response =
                service.registrarResultado(proveedor, partido.getId(), new RegistrarResultadoRequest(2, 1));

        assertThat(response.estado()).isEqualTo(PartidoEstado.JUGADO);
        assertThat(response.ganadorId()).isEqualTo(a.getId());
        assertThat(response.marcadorA()).isEqualTo(2);
        assertThat(response.marcadorB()).isEqualTo(1);
    }
}
