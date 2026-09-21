package com.sporthub.deportes;

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
@Table(name = "reserva_instalacion")
public class ReservaInstalacion {

    @Id
    @UuidGenerator
    private UUID id;

    @Column(name = "instalacion_id", nullable = false)
    private UUID instalacionId;

    @Column(name = "client_id", nullable = false)
    private UUID clientId;

    @Column(nullable = false)
    private LocalDate fecha;

    @Column(name = "hora_inicio", nullable = false)
    private LocalTime horaInicio;

    @Column(name = "hora_fin", nullable = false)
    private LocalTime horaFin;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ReservaInstalacionEstado estado;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    protected ReservaInstalacion() {}

    public ReservaInstalacion(
            UUID instalacionId, UUID clientId, LocalDate fecha, LocalTime horaInicio, LocalTime horaFin) {
        this.instalacionId = instalacionId;
        this.clientId = clientId;
        this.fecha = fecha;
        this.horaInicio = horaInicio;
        this.horaFin = horaFin;
        this.estado = ReservaInstalacionEstado.RESERVADA;
    }

    public boolean superpuesta(LocalTime inicio, LocalTime fin) {
        return horaInicio.isBefore(fin) && inicio.isBefore(horaFin);
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getInstalacionId() {
        return instalacionId;
    }

    public UUID getClientId() {
        return clientId;
    }

    public LocalDate getFecha() {
        return fecha;
    }

    public LocalTime getHoraInicio() {
        return horaInicio;
    }

    public LocalTime getHoraFin() {
        return horaFin;
    }

    public ReservaInstalacionEstado getEstado() {
        return estado;
    }

    public void setEstado(ReservaInstalacionEstado estado) {
        this.estado = estado;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
