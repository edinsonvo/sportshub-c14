package com.sporthub.deportes;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TorneoRepository extends JpaRepository<Torneo, UUID> {

    List<Torneo> findAllByOrderByFechaInicioDesc();
}
