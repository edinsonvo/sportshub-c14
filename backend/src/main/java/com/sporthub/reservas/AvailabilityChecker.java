package com.sporthub.reservas;

import com.sporthub.infra.BusinessException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

/**
 * Experto en disponibilidad de citas (HU-33). Aplica RN-1 (no doble reserva) y RN-2 (no superposición).
 */
@Component
public class AvailabilityChecker {

    private final ProviderServiceRepository serviceRepository;
    private final ServiceScheduleRepository scheduleRepository;
    private final AppointmentRepository appointmentRepository;

    public AvailabilityChecker(
            ProviderServiceRepository serviceRepository,
            ServiceScheduleRepository scheduleRepository,
            AppointmentRepository appointmentRepository) {
        this.serviceRepository = serviceRepository;
        this.scheduleRepository = scheduleRepository;
        this.appointmentRepository = appointmentRepository;
    }

    public record Slot(LocalDateTime start, LocalDateTime end) {}

    public List<Slot> findSlots(UUID providerServiceId, LocalDate date) {
        ProviderService service = serviceRepository
                .findByIdAndActiveTrue(providerServiceId)
                .orElseThrow(() -> new BusinessException(
                        "SERVICIO_INACTIVO", "El servicio no existe o no está activo", HttpStatus.NOT_FOUND));
        List<ServiceSchedule> schedules = scheduleRepository.findByProviderServiceIdAndDayOfWeekAndBlockedFalse(
                providerServiceId, date.getDayOfWeek());
        List<Slot> slots = new ArrayList<>();
        for (ServiceSchedule schedule : schedules) {
            List<Appointment> taken = appointmentRepository.findByStaffIdAndDateAndStatusIn(
                    schedule.getStaffId(), date, AppointmentStatus.ACTIVAS);
            slots.addAll(generateSlots(
                    date, schedule.getStartTime(), schedule.getEndTime(), service.getDurationMinutes(), taken));
        }
        slots.sort(Comparator.comparing(Slot::start));
        return slots;
    }

    public boolean hasConflict(UUID staffId, LocalDate date, LocalTime start, LocalTime end) {
        return appointmentRepository.existsByStaffIdAndDateAndStatusInAndStartTimeLessThanAndEndTimeGreaterThan(
                staffId, date, AppointmentStatus.ACTIVAS, end, start);
    }

    public static List<Slot> generateSlots(
            LocalDate date, LocalTime startTime, LocalTime endTime, int durationMinutes, List<Appointment> taken) {
        List<Slot> slots = new ArrayList<>();
        LocalTime cursor = startTime;
        while (!cursor.plusMinutes(durationMinutes).isAfter(endTime)) {
            LocalTime slotEnd = cursor.plusMinutes(durationMinutes);
            LocalTime slotStart = cursor;
            boolean free = taken.stream()
                    .noneMatch(a -> a.getStartTime().isBefore(slotEnd) && slotStart.isBefore(a.getEndTime()));
            if (free) {
                slots.add(new Slot(LocalDateTime.of(date, cursor), LocalDateTime.of(date, slotEnd)));
            }
            cursor = slotEnd;
        }
        return slots;
    }
}
