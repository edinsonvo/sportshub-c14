package com.sporthub.deportes;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReservaInstalacionRepository extends JpaRepository<ReservaInstalacion, UUID> {

    List<ReservaInstalacion> findByInstalacionIdAndFechaAndEstadoIn(
            UUID instalacionId, LocalDate fecha, Collection<ReservaInstalacionEstado> estados);

    List<ReservaInstalacion> findByClientIdOrderByFechaDesc(UUID clientId);
}
