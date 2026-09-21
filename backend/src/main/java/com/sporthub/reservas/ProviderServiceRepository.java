package com.sporthub.reservas;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProviderServiceRepository extends JpaRepository<ProviderService, UUID> {

    List<ProviderService> findByProviderIdOrderByNameAsc(UUID providerId);

    Optional<ProviderService> findByIdAndActiveTrue(UUID id);
}
