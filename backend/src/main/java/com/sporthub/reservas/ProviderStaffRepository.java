package com.sporthub.reservas;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProviderStaffRepository extends JpaRepository<ProviderStaff, UUID> {

    List<ProviderStaff> findByProviderId(UUID providerId);

    Optional<ProviderStaff> findFirstByUserId(UUID userId);

    boolean existsByProviderIdAndUserId(UUID providerId, UUID userId);
}
