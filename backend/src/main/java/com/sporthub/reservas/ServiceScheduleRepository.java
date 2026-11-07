package com.sporthub.reservas;

import java.time.DayOfWeek;
import java.util.Collection;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ServiceScheduleRepository extends JpaRepository<ServiceSchedule, UUID> {

    List<ServiceSchedule> findByProviderServiceIdAndDayOfWeekAndBlockedFalse(
            UUID providerServiceId, DayOfWeek dayOfWeek);

    List<ServiceSchedule> findByProviderServiceId(UUID providerServiceId);

    List<ServiceSchedule> findByStaffId(UUID staffId);

    List<ServiceSchedule> findByProviderIdOrderByDayOfWeekAscStartTimeAsc(UUID providerId);

    List<ServiceSchedule> findByIdInAndBlockedFalse(Collection<UUID> ids);
}
