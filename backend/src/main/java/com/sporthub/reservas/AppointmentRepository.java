package com.sporthub.reservas;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface AppointmentRepository extends JpaRepository<Appointment, UUID>, JpaSpecificationExecutor<Appointment> {

    List<Appointment> findByClientIdOrderByDateDesc(UUID clientId);

    List<Appointment> findByProviderIdOrderByDateDesc(UUID providerId);

    List<Appointment> findByStaffIdOrderByDateDesc(UUID staffId);

    boolean existsByStaffIdAndDateAndStatusInAndStartTimeLessThanAndEndTimeGreaterThan(
            UUID staffId,
            LocalDate date,
            Collection<AppointmentStatus> statuses,
            LocalTime endTime,
            LocalTime startTime);

    List<Appointment> findByStaffIdAndDateAndStatusIn(
            UUID staffId, LocalDate date, Collection<AppointmentStatus> statuses);

    Optional<Appointment> findByProviderServiceIdAndDateAndStartTime(
            UUID providerServiceId, LocalDate date, LocalTime startTime);
}
