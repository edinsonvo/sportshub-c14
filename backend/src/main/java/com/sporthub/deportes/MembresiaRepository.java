package com.sporthub.deportes;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MembresiaRepository extends JpaRepository<Membresia, UUID> {

    List<Membresia> findByClientIdOrderByFechaInicioDesc(UUID clientId);

    Optional<Membresia> findFirstByClientIdAndEstadoOrderByFechaFinDesc(UUID clientId, MembresiaEstado estado);

    List<Membresia> findAllByPlanIdInOrderByFechaInicioDesc(Collection<UUID> planIds);
}
