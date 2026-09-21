package com.sporthub.deportes;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;
import org.hibernate.annotations.UuidGenerator;

@Entity
@Table(name = "membresia")
public class Membresia {

    @Id
    @UuidGenerator
    private UUID id;

    @Column(name = "plan_id", nullable = false)
    private UUID planId;

    @Column(name = "client_id", nullable = false)
    private UUID clientId;

    @Column(name = "fecha_inicio", nullable = false)
    private LocalDate fechaInicio;

    @Column(name = "fecha_fin", nullable = false)
    private LocalDate fechaFin;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private MembresiaEstado estado;

    @Column(length = 500)
    private String motivo;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    protected Membresia() {}

    public Membresia(UUID planId, UUID clientId, LocalDate fechaInicio, LocalDate fechaFin) {
        this.planId = planId;
        this.clientId = clientId;
        this.fechaInicio = fechaInicio;
        this.fechaFin = fechaFin;
        this.estado = MembresiaEstado.ACTIVA;
    }

    public void renovar(int vigenciaDias) {
        this.fechaFin = this.fechaFin.plusDays(vigenciaDias);
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getPlanId() {
        return planId;
    }

    public UUID getClientId() {
        return clientId;
    }

    public LocalDate getFechaInicio() {
        return fechaInicio;
    }

    public LocalDate getFechaFin() {
        return fechaFin;
    }

    public void setFechaFin(LocalDate fechaFin) {
        this.fechaFin = fechaFin;
    }

    public MembresiaEstado getEstado() {
        return estado;
    }

    public void setEstado(MembresiaEstado estado) {
        this.estado = estado;
    }

    public String getMotivo() {
        return motivo;
    }

    public void setMotivo(String motivo) {
        this.motivo = motivo;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
