package com.sporthub.deportes;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ParticipanteTorneoRepository extends JpaRepository<ParticipanteTorneo, UUID> {

    boolean existsByTorneoIdAndClientId(UUID torneoId, UUID clientId);

    long countByTorneoIdAndEstado(UUID torneoId, ParticipanteEstado estado);

    List<ParticipanteTorneo> findByTorneoIdAndEstadoOrderByCreatedAtAsc(UUID torneoId, ParticipanteEstado estado);
}
