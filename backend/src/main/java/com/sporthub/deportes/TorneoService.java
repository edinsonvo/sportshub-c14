package com.sporthub.deportes;

import com.sporthub.infra.AuditLogger;
import com.sporthub.infra.BusinessException;
import com.sporthub.infra.SportHubMetrics;
import com.sporthub.reservas.Provider;
import com.sporthub.reservas.ProviderRepository;
import com.sporthub.user.Role;
import com.sporthub.user.UserAccount;
import com.sporthub.user.UserRepository;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TorneoService {

    private final TorneoRepository torneoRepository;
    private final ParticipanteTorneoRepository participanteRepository;
    private final PartidoTorneoRepository partidoRepository;
    private final ProviderRepository providerRepository;
    private final UserRepository userRepository;
    private final AuditLogger auditLogger;
    private final SportHubMetrics metrics;

    public TorneoService(
            TorneoRepository torneoRepository,
            ParticipanteTorneoRepository participanteRepository,
            PartidoTorneoRepository partidoRepository,
            ProviderRepository providerRepository,
            UserRepository userRepository,
            AuditLogger auditLogger,
            SportHubMetrics metrics) {
        this.torneoRepository = torneoRepository;
        this.participanteRepository = participanteRepository;
        this.partidoRepository = partidoRepository;
        this.providerRepository = providerRepository;
        this.userRepository = userRepository;
        this.auditLogger = auditLogger;
        this.metrics = metrics;
    }

    @Transactional
    public TorneoResponse crear(UserAccount caller, CrearTorneoRequest request) {
        if (request.fechaFin().isBefore(request.fechaInicio())) {
            throw new BusinessException("FECHAS_INVALIDAS", "La fecha fin debe ser posterior", HttpStatus.BAD_REQUEST);
        }
        Torneo torneo = new Torneo(
                requireProviderId(caller),
                request.nombre(),
                request.categoria(),
                request.formato(),
                request.fechaInicio(),
                request.fechaFin(),
                request.cupo());
        torneoRepository.save(torneo);
        metrics.torneoCreado();
        auditLogger.record("Torneo", torneo.getId().toString(), "CREADO", caller.getEmail(), null);
        return TorneoResponse.from(torneo);
    }

    @Transactional(readOnly = true)
    public List<TorneoResponse> listar() {
        return torneoRepository.findAllByOrderByFechaInicioDesc().stream()
                .map(TorneoResponse::from)
                .toList();
    }

    @Transactional
    public ParticipanteResponse inscribir(UserAccount client, UUID torneoId, InscribirTorneoRequest request) {
        Torneo torneo = require(torneoId);
        if (torneo.getEstado() != TorneoEstado.PROXIMO) {
            throw new BusinessException("TORNEO_CERRADO", "El torneo ya no acepta inscripciones", HttpStatus.CONFLICT);
        }
        if (participanteRepository.existsByTorneoIdAndClientId(torneoId, client.getId())) {
            throw new BusinessException("YA_INSCRITO", "Ya está inscrito en este torneo", HttpStatus.CONFLICT);
        }
        if (participanteRepository.countByTorneoIdAndEstado(torneoId, ParticipanteEstado.CONFIRMADO)
                >= torneo.getCupo()) {
            throw new BusinessException("CUPO_COMPLETO", "El cupo del torneo está completo", HttpStatus.CONFLICT);
        }
        ParticipanteTorneo participante =
                new ParticipanteTorneo(torneoId, client.getId(), request == null ? null : request.nombreEquipo());
        participante.setEstado(ParticipanteEstado.CONFIRMADO);
        participanteRepository.save(participante);
        metrics.torneoInscrito();
        auditLogger.record("ParticipanteTorneo", participante.getId().toString(), "INSCRITO", client.getEmail(), null);
        return ParticipanteResponse.from(participante);
    }

    @Transactional
    public TorneoResponse abrir(UserAccount caller, UUID torneoId) {
        Torneo torneo = require(torneoId);
        requireProviderOwner(caller, torneo.getProviderId());
        if (torneo.getEstado() != TorneoEstado.PROXIMO) {
            throw new BusinessException(
                    "TRANSICION_INVALIDA", "Solo se pueden abrir torneos próximos", HttpStatus.CONFLICT);
        }
        List<ParticipanteTorneo> confirmados = participanteRepository.findByTorneoIdAndEstadoOrderByCreatedAtAsc(
                torneoId, ParticipanteEstado.CONFIRMADO);
        if (confirmados.size() < 2) {
            throw new BusinessException(
                    "PARTICIPANTES_INSUFICIENTES", "Se requieren al menos 2 participantes", HttpStatus.BAD_REQUEST);
        }
        if (confirmados.size() % 2 != 0) {
            throw new BusinessException(
                    "NUMERO_PAR_REQUERIDO",
                    "Se requiere un número par de participantes para generar las llaves",
                    HttpStatus.BAD_REQUEST);
        }
        for (int i = 0; i < confirmados.size(); i += 2) {
            ParticipanteTorneo a = confirmados.get(i);
            ParticipanteTorneo b = confirmados.get(i + 1);
            partidoRepository.save(new PartidoTorneo(torneoId, 1, a.getId(), b.getId(), torneo.getFechaInicio()));
        }
        torneo.setEstado(TorneoEstado.EN_CURSO);
        torneoRepository.save(torneo);
        auditLogger.record("Torneo", torneoId.toString(), "ABIERTO", caller.getEmail(), null);
        return TorneoResponse.from(torneo);
    }

    @Transactional
    public PartidoResponse registrarResultado(UserAccount caller, UUID partidoId, RegistrarResultadoRequest request) {
        PartidoTorneo partido = partidoRepository
                .findById(partidoId)
                .orElseThrow(
                        () -> new BusinessException("NO_ENCONTRADO", "Partido no encontrado", HttpStatus.NOT_FOUND));
        Torneo torneo = require(partido.getTorneoId());
        requireProviderOwner(caller, torneo.getProviderId());
        if (partido.getEstado() != PartidoEstado.PROGRAMADO) {
            throw new BusinessException("TRANSICION_INVALIDA", "El partido ya fue registrado", HttpStatus.CONFLICT);
        }
        partido.registrarResultado(request.marcadorA(), request.marcadorB());
        partidoRepository.save(partido);
        auditLogger.record(
                "PartidoTorneo",
                partidoId.toString(),
                "JUGADO",
                caller.getEmail(),
                request.marcadorA() + "-" + request.marcadorB());
        return PartidoResponse.from(partido);
    }

    @Transactional
    public TorneoResponse finalizar(UserAccount caller, UUID torneoId) {
        Torneo torneo = require(torneoId);
        requireProviderOwner(caller, torneo.getProviderId());
        if (torneo.getEstado() != TorneoEstado.EN_CURSO) {
            throw new BusinessException(
                    "TRANSICION_INVALIDA", "Solo se pueden finalizar torneos en curso", HttpStatus.CONFLICT);
        }
        torneo.setEstado(TorneoEstado.FINALIZADO);
        torneoRepository.save(torneo);
        auditLogger.record("Torneo", torneoId.toString(), "FINALIZADO", caller.getEmail(), null);
        return TorneoResponse.from(torneo);
    }

    @Transactional(readOnly = true)
    public List<PartidoResponse> partidos(UUID torneoId) {
        require(torneoId);
        return partidoRepository.findByTorneoIdOrderByRondaAsc(torneoId).stream()
                .map(PartidoResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<RankingEntry> ranking(UUID torneoId) {
        Torneo torneo = require(torneoId);
        List<ParticipanteTorneo> participantes = participanteRepository.findByTorneoIdAndEstadoOrderByCreatedAtAsc(
                torneoId, ParticipanteEstado.CONFIRMADO);
        Map<UUID, int[]> stats = new HashMap<>();
        for (ParticipanteTorneo p : participantes) {
            stats.put(p.getId(), new int[] {0, 0, 0});
        }
        for (PartidoTorneo partido :
                partidoRepository.findByTorneoIdAndEstadoOrderByRondaAsc(torneoId, PartidoEstado.JUGADO)) {
            int[] a = stats.get(partido.getParticipanteAId());
            int[] b = stats.get(partido.getParticipanteBId());
            if (a == null || b == null) {
                continue;
            }
            a[0]++;
            b[0]++;
            if (partido.getGanadorId() == null) {
                a[2] += puntos(formato(torneo), false);
                b[2] += puntos(formato(torneo), false);
            } else {
                int[] ganador = partido.getGanadorId().equals(partido.getParticipanteAId()) ? a : b;
                ganador[1]++;
                ganador[2] += puntos(formato(torneo), true);
            }
        }
        return participantes.stream()
                .map(p -> {
                    int[] s = stats.get(p.getId());
                    return new RankingEntry(p.getId(), nombreParticipante(p), s[0], s[1], s[2]);
                })
                .sorted(Comparator.comparingInt(RankingEntry::puntos)
                        .reversed()
                        .thenComparing(
                                Comparator.comparingInt(RankingEntry::ganados).reversed()))
                .toList();
    }

    private FormatoTorneo formato(Torneo torneo) {
        return torneo.getFormato();
    }

    private int puntos(FormatoTorneo formato, boolean victoria) {
        if (formato == FormatoTorneo.LIGA) {
            return victoria ? 3 : 1;
        }
        return victoria ? 1 : 0;
    }

    private String nombreParticipante(ParticipanteTorneo participante) {
        if (participante.getNombreEquipo() != null
                && !participante.getNombreEquipo().isBlank()) {
            return participante.getNombreEquipo();
        }
        return userRepository
                .findById(participante.getClientId())
                .map(UserAccount::getFullName)
                .orElse(participante.getClientId().toString());
    }

    private Torneo require(UUID torneoId) {
        return torneoRepository
                .findById(torneoId)
                .orElseThrow(
                        () -> new BusinessException("NO_ENCONTRADO", "Torneo no encontrado", HttpStatus.NOT_FOUND));
    }

    private UUID requireProviderId(UserAccount caller) {
        if (caller.getRole() == Role.ADMIN) {
            throw new BusinessException("ROL_INVALIDO", "El administrador no posee torneos", HttpStatus.BAD_REQUEST);
        }
        return providerRepository
                .findByUserId(caller.getId())
                .map(Provider::getId)
                .orElseThrow(() -> new BusinessException(
                        "PROVEEDOR_NO_ENCONTRADO", "Perfil de proveedor no encontrado", HttpStatus.NOT_FOUND));
    }

    private void requireProviderOwner(UserAccount caller, UUID providerId) {
        if (caller.getRole() == Role.ADMIN) {
            return;
        }
        boolean owner = providerRepository
                .findByUserId(caller.getId())
                .map(p -> p.getId().equals(providerId))
                .orElse(false);
        if (!owner) {
            throw new BusinessException("FORBIDDEN", "No tiene permisos para esta operación", HttpStatus.FORBIDDEN);
        }
    }
}
