package com.sporthub.reservas;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class AppointmentStatusTest {

    @Test
    @DisplayName("Los estados activos impiden doble reserva (RN-1)")
    void activasNoDebenContenerCompletadaNiCancelada() {
        assertThat(AppointmentStatus.ACTIVAS)
                .contains(AppointmentStatus.SOLICITADA, AppointmentStatus.CONFIRMADA, AppointmentStatus.REPROGRAMADA)
                .doesNotContain(AppointmentStatus.COMPLETADA, AppointmentStatus.CANCELADA);
    }
}

class AvailabilityCheckerTest {

    @Test
    @DisplayName("Genera todas las franjas de 60 min dentro del rango")
    void generaFranjasTotales() {
        LocalDate dia = LocalDate.of(2026, 9, 20);
        List<AvailabilityChecker.Slot> slots =
                AvailabilityChecker.generateSlots(dia, LocalTime.of(9, 0), LocalTime.of(17, 0), 60, List.of());
        assertThat(slots).hasSize(8);
        assertThat(slots.get(0).start().toLocalDate()).isEqualTo(dia);
        assertThat(slots.get(0).start().toLocalTime()).isEqualTo(LocalTime.of(9, 0));
        assertThat(slots.get(7).start().toLocalTime()).isEqualTo(LocalTime.of(16, 0));
    }

    @Test
    @DisplayName("Excluye franja ocupada por una cita existente")
    void excluyeFranjaReservada() {
        Appointment taken = new Appointment(
                UUID.randomUUID(),
                UUID.randomUUID(),
                UUID.randomUUID(),
                UUID.randomUUID(),
                LocalDate.of(2026, 9, 20),
                LocalTime.of(10, 0),
                LocalTime.of(11, 0));
        List<AvailabilityChecker.Slot> slots = AvailabilityChecker.generateSlots(
                LocalDate.of(2026, 9, 20), LocalTime.of(9, 0), LocalTime.of(17, 0), 60, List.of(taken));
        assertThat(slots).hasSize(7);
        assertThat(slots).noneMatch(s -> s.start().toLocalTime().equals(LocalTime.of(10, 0)));
    }
}
