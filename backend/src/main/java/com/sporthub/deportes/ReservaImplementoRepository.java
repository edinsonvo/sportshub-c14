package com.sporthub.deportes;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReservaImplementoRepository extends JpaRepository<ReservaImplemento, UUID> {

    List<ReservaImplemento> findByImplementoIdAndFechaAndEstadoIn(
            UUID implementoId, LocalDate fecha, Collection<ReservaImplementoEstado> estados);

    List<ReservaImplemento> findByClientIdOrderByFechaDesc(UUID clientId);
}
