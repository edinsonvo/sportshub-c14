package com.sporthub.deportes;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ListaEsperaInstalacionRepository extends JpaRepository<ListaEsperaInstalacion, UUID> {

    Optional<ListaEsperaInstalacion> findFirstByInstalacionIdAndFechaAndHoraInicioAndEstadoOrderByCreatedAtAsc(
            UUID instalacionId, LocalDate fecha, LocalTime horaInicio, ListaEsperaEstado estado);

    boolean existsByInstalacionIdAndClientIdAndFechaAndHoraInicioAndEstadoIn(
            UUID instalacionId,
            UUID clientId,
            LocalDate fecha,
            LocalTime horaInicio,
            Collection<ListaEsperaEstado> estados);

    List<ListaEsperaInstalacion> findByClientIdOrderByCreatedAtDesc(UUID clientId);
}
