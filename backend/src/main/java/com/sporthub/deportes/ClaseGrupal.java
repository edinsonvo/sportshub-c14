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
@Table(name = "clase_grupal")
public class ClaseGrupal {

    @Id
    @UuidGenerator
    private UUID id;

    @Column(name = "provider_id", nullable = false)
    private UUID providerId;

    @Column(name = "instalacion_id", nullable = false)
    private UUID instalacionId;

    @Column(name = "entrenador_staff_id", nullable = false)
    private UUID entrenadorStaffId;

    @Column(nullable = false, length = 160)
    private String nombre;

    @Column(nullable = false, length = 40)
    private String nivel;

    @Column(nullable = false)
    private LocalDate fecha;

    @Column(nullable = false)
    private LocalTime hora;

    @Column(name = "duracion_min", nullable = false)
    private int duracionMin;

    @Column(nullable = false)
    private int cupo;

    @Column(nullable = false)
    private boolean activa;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    protected ClaseGrupal() {}

    public ClaseGrupal(
            UUID providerId,
            UUID instalacionId,
            UUID entrenadorStaffId,
            String nombre,
            String nivel,
            LocalDate fecha,
            LocalTime hora,
            int duracionMin,
            int cupo) {
        this.providerId = providerId;
        this.instalacionId = instalacionId;
        this.entrenadorStaffId = entrenadorStaffId;
        this.nombre = nombre;
        this.nivel = nivel;
        this.fecha = fecha;
        this.hora = hora;
        this.duracionMin = duracionMin;
        this.cupo = cupo;
        this.activa = true;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getProviderId() {
        return providerId;
    }

    public UUID getInstalacionId() {
        return instalacionId;
    }

    public UUID getEntrenadorStaffId() {
        return entrenadorStaffId;
    }

    public String getNombre() {
        return nombre;
    }

    public String getNivel() {
        return nivel;
    }

    public LocalDate getFecha() {
        return fecha;
    }

    public LocalTime getHora() {
        return hora;
    }

    public int getDuracionMin() {
        return duracionMin;
    }

    public int getCupo() {
        return cupo;
    }

    public boolean isActiva() {
        return activa;
    }

    public void setActiva(boolean activa) {
        this.activa = activa;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
