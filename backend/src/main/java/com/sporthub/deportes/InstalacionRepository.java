package com.sporthub.deportes;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InstalacionRepository extends JpaRepository<Instalacion, UUID> {

    Optional<Instalacion> findByIdAndActivaTrue(UUID id);

    List<Instalacion> findByActivaTrueOrderByNombreAsc();

    List<Instalacion> findByProviderIdOrderByNombreAsc(UUID providerId);
}
