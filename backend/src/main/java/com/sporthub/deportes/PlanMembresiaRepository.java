package com.sporthub.deportes;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PlanMembresiaRepository extends JpaRepository<PlanMembresia, UUID> {

    Optional<PlanMembresia> findByIdAndActivoTrue(UUID id);

    List<PlanMembresia> findByActivoTrueOrderByNombreAsc();

    List<PlanMembresia> findByProviderIdOrderByNombreAsc(UUID providerId);
}
