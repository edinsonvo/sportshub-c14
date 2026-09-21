package com.sporthub.deportes;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalTime;
import java.util.UUID;
import org.hibernate.annotations.UuidGenerator;

@Entity
@Table(name = "instalacion")
public class Instalacion {

    @Id
    @UuidGenerator
    private UUID id;

    @Column(name = "provider_id", nullable = false)
    private UUID providerId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TipoInstalacion tipo;

    @Column(nullable = false, length = 160)
    private String nombre;

    @Column(nullable = false)
    private int capacidad;

    @Column(name = "tarifa_por_hora", nullable = false, precision = 10, scale = 2)
    private BigDecimal tarifaPorHora;

    @Column(name = "hora_apertura", nullable = false)
    private LocalTime horaApertura;

    @Column(name = "hora_cierre", nullable = false)
    private LocalTime horaCierre;

    @Column(nullable = false)
    private boolean activa;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    protected Instalacion() {}

    public Instalacion(
            UUID providerId,
            TipoInstalacion tipo,
            String nombre,
            int capacidad,
            BigDecimal tarifaPorHora,
            LocalTime horaApertura,
            LocalTime horaCierre) {
        this.providerId = providerId;
        this.tipo = tipo;
        this.nombre = nombre;
        this.capacidad = capacidad;
        this.tarifaPorHora = tarifaPorHora;
        this.horaApertura = horaApertura;
        this.horaCierre = horaCierre;
        this.activa = true;
    }

    public boolean dentroDeHorario(LocalTime inicio, LocalTime fin) {
        return !inicio.isBefore(horaApertura) && !fin.isAfter(horaCierre);
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

    public TipoInstalacion getTipo() {
        return tipo;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public int getCapacidad() {
        return capacidad;
    }

    public BigDecimal getTarifaPorHora() {
        return tarifaPorHora;
    }

    public LocalTime getHoraApertura() {
        return horaApertura;
    }

    public LocalTime getHoraCierre() {
        return horaCierre;
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
