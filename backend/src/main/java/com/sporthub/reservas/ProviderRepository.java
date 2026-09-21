package com.sporthub.reservas;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProviderRepository extends JpaRepository<Provider, UUID> {

    Optional<Provider> findByUserId(UUID userId);
}
