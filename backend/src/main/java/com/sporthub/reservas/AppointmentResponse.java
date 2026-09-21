package com.sporthub.reservas;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

public record AppointmentResponse(
        UUID id,
        UUID providerServiceId,
        UUID providerId,
        UUID clientId,
        UUID staffId,
        LocalDate date,
        LocalTime startTime,
        LocalTime endTime,
        AppointmentStatus status,
        String cancellationReason) {

    public static AppointmentResponse from(Appointment a) {
        return new AppointmentResponse(
                a.getId(),
                a.getProviderServiceId(),
                a.getProviderId(),
                a.getClientId(),
                a.getStaffId(),
                a.getDate(),
                a.getStartTime(),
                a.getEndTime(),
                a.getStatus(),
                a.getCancellationReason());
    }
}
