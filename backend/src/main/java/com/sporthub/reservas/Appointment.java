package com.sporthub.reservas;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;
import org.hibernate.annotations.UuidGenerator;

@Entity
@Table(name = "appointment")
public class Appointment {

    @Id
    @UuidGenerator
    private UUID id;

    @Column(name = "provider_service_id", nullable = false)
    private UUID providerServiceId;

    @Column(name = "client_id", nullable = false)
    private UUID clientId;

    @Column(name = "staff_id", nullable = false)
    private UUID staffId;

    @Column(name = "provider_id", nullable = false)
    private UUID providerId;

    @Column(nullable = false)
    private LocalDate date;

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private AppointmentStatus status;

    @Column(name = "cancellation_reason", length = 500)
    private String cancellationReason;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    protected Appointment() {}

    public Appointment(
            UUID providerServiceId,
            UUID clientId,
            UUID staffId,
            UUID providerId,
            LocalDate date,
            LocalTime startTime,
            LocalTime endTime) {
        this.providerServiceId = providerServiceId;
        this.clientId = clientId;
        this.staffId = staffId;
        this.providerId = providerId;
        this.date = date;
        this.startTime = startTime;
        this.endTime = endTime;
        this.status = AppointmentStatus.SOLICITADA;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getProviderServiceId() {
        return providerServiceId;
    }

    public UUID getClientId() {
        return clientId;
    }

    public UUID getStaffId() {
        return staffId;
    }

    public UUID getProviderId() {
        return providerId;
    }

    public LocalDate getDate() {
        return date;
    }

    public LocalTime getStartTime() {
        return startTime;
    }

    public LocalTime getEndTime() {
        return endTime;
    }

    public AppointmentStatus getStatus() {
        return status;
    }

    public void setStatus(AppointmentStatus status) {
        this.status = status;
    }

    public String getCancellationReason() {
        return cancellationReason;
    }

    public void setCancellationReason(String cancellationReason) {
        this.cancellationReason = cancellationReason;
    }

    public void reschedule(LocalDate newDate, LocalTime newStart, LocalTime newEnd) {
        this.date = newDate;
        this.startTime = newStart;
        this.endTime = newEnd;
        this.status = AppointmentStatus.REPROGRAMADA;
    }
}
