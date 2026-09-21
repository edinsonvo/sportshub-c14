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
@Table(name = "torneo")
public class Torneo {

    @Id
    @UuidGenerator
    private UUID id;

    @Column(name = "provider_id", nullable = false)
    private UUID providerId;

    @Column(nullable = false, length = 160)
    private String nombre;

    @Column(nullable = false, length = 80)
    private String categoria;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private FormatoTorneo formato;

    @Column(name = "fecha_inicio", nullable = false)
    private LocalDate fechaInicio;

    @Column(name = "fecha_fin", nullable = false)
    private LocalDate fechaFin;

    @Column(nullable = false)
    private int cupo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TorneoEstado estado;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    protected Torneo() {}

    public Torneo(
            UUID providerId,
            String nombre,
            String categoria,
            FormatoTorneo formato,
            LocalDate fechaInicio,
            LocalDate fechaFin,
            int cupo) {
        this.providerId = providerId;
        this.nombre = nombre;
        this.categoria = categoria;
        this.formato = formato;
        this.fechaInicio = fechaInicio;
        this.fechaFin = fechaFin;
        this.cupo = cupo;
        this.estado = TorneoEstado.PROXIMO;
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

    public String getNombre() {
        return nombre;
    }

    public String getCategoria() {
        return categoria;
    }

    public FormatoTorneo getFormato() {
        return formato;
    }

    public LocalDate getFechaInicio() {
        return fechaInicio;
    }

    public LocalDate getFechaFin() {
        return fechaFin;
    }

    public int getCupo() {
        return cupo;
    }

    public TorneoEstado getEstado() {
        return estado;
    }

    public void setEstado(TorneoEstado estado) {
        this.estado = estado;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
