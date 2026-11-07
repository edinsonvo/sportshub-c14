package com.sporthub.reservas;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.UUID;

public record ScheduleResponse(
        UUID id,
        UUID providerServiceId,
        UUID providerId,
        UUID staffId,
        String staffName,
        DayOfWeek dayOfWeek,
        LocalTime startTime,
        LocalTime endTime,
        boolean blocked) {

    public static ScheduleResponse of(ServiceSchedule s, String staffName) {
        return new ScheduleResponse(
                s.getId(),
                s.getProviderServiceId(),
                s.getProviderId(),
                s.getStaffId(),
                staffName,
                s.getDayOfWeek(),
                s.getStartTime(),
                s.getEndTime(),
                s.isBlocked());
    }
}
