package com.sporthub.deportes;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InstalacionMantenimientoRepository extends JpaRepository<InstalacionMantenimiento, UUID> {

    List<InstalacionMantenimiento> findByInstalacionIdAndFechaAndActivoTrue(UUID instalacionId, LocalDate fecha);
}
