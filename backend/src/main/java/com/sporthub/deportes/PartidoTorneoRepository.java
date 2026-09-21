package com.sporthub.deportes;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PartidoTorneoRepository extends JpaRepository<PartidoTorneo, UUID> {

    List<PartidoTorneo> findByTorneoIdAndEstadoOrderByRondaAsc(UUID torneoId, PartidoEstado estado);

    List<PartidoTorneo> findByTorneoIdOrderByRondaAsc(UUID torneoId);
}
