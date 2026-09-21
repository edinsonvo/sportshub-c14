package com.sporthub.deportes;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ImplementoRepository extends JpaRepository<Implemento, UUID> {

    Optional<Implemento> findByIdAndActivoTrue(UUID id);

    List<Implemento> findByActivoTrueOrderByNombreAsc();

    List<Implemento> findByProviderIdOrderByNombreAsc(UUID providerId);
}
