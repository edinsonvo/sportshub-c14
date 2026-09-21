package com.sporthub.deportes;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InscripcionClaseRepository extends JpaRepository<InscripcionClase, UUID> {

    long countByClaseGrupalIdAndEstadoIn(UUID claseGrupalId, Collection<InscripcionEstado> estados);

    boolean existsByClaseGrupalIdAndClientIdAndEstadoIn(
            UUID claseGrupalId, UUID clientId, Collection<InscripcionEstado> estados);

    Optional<InscripcionClase> findFirstByClaseGrupalIdAndEstadoOrderByCreatedAtAsc(
            UUID claseGrupalId, InscripcionEstado estado);

    List<InscripcionClase> findByClaseGrupalIdAndEstadoInOrderByCreatedAtAsc(
            UUID claseGrupalId, Collection<InscripcionEstado> estados);

    List<InscripcionClase> findByClientIdOrderByCreatedAtDesc(UUID clientId);
}
