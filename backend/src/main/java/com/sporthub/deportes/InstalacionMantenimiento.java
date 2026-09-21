package com.sporthub.deportes;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;
import org.hibernate.annotations.UuidGenerator;

@Entity
@Table(name = "instalacion_mantenimiento")
public class InstalacionMantenimiento {

    @Id
    @UuidGenerator
    private UUID id;

    @Column(name = "instalacion_id", nullable = false)
    private UUID instalacionId;

    @Column(nullable = false)
    private LocalDate fecha;

    @Column(name = "hora_inicio", nullable = false)
    private LocalTime horaInicio;

    @Column(name = "hora_fin", nullable = false)
    private LocalTime horaFin;

    @Column(length = 500)
    private String motivo;

    @Column(nullable = false)
    private boolean activo;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    protected InstalacionMantenimiento() {}

    public InstalacionMantenimiento(
            UUID instalacionId, LocalDate fecha, LocalTime horaInicio, LocalTime horaFin, String motivo) {
        this.instalacionId = instalacionId;
        this.fecha = fecha;
        this.horaInicio = horaInicio;
        this.horaFin = horaFin;
        this.motivo = motivo;
        this.activo = true;
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

    public LocalDate getFecha() {
        return fecha;
    }

    public LocalTime getHoraInicio() {
        return horaInicio;
    }

    public LocalTime getHoraFin() {
        return horaFin;
    }

    public String getMotivo() {
        return motivo;
    }

    public boolean isActivo() {
        return activo;
    }

    public void setActivo(boolean activo) {
        this.activo = activo;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
