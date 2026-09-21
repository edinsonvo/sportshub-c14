package com.sporthub.deportes;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClaseGrupalRepository extends JpaRepository<ClaseGrupal, UUID> {

    Optional<ClaseGrupal> findByIdAndActivaTrue(UUID id);

    List<ClaseGrupal> findByActivaTrueOrderByFechaAsc();

    List<ClaseGrupal> findByProviderIdOrderByFechaDesc(UUID providerId);

    List<ClaseGrupal> findByInstalacionIdAndActivaTrueOrderByFechaAsc(UUID instalacionId);
}
