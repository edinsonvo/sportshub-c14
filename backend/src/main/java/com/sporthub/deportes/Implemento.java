package com.sporthub.deportes;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.UuidGenerator;

@Entity
@Table(name = "implemento")
public class Implemento {

    @Id
    @UuidGenerator
    private UUID id;

    @Column(name = "provider_id", nullable = false)
    private UUID providerId;

    @Column(nullable = false, length = 160)
    private String nombre;

    @Column(nullable = false, length = 80)
    private String tipo;

    @Column(name = "cantidad_total", nullable = false)
    private int cantidadTotal;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal tarifa;

    @Column(nullable = false)
    private boolean activo;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    protected Implemento() {}

    public Implemento(UUID providerId, String nombre, String tipo, int cantidadTotal, BigDecimal tarifa) {
        this.providerId = providerId;
        this.nombre = nombre;
        this.tipo = tipo;
        this.cantidadTotal = cantidadTotal;
        this.tarifa = tarifa;
        this.activo = true;
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

    public String getTipo() {
        return tipo;
    }

    public int getCantidadTotal() {
        return cantidadTotal;
    }

    public void reducirStock(int cantidad) {
        this.cantidadTotal = Math.max(0, this.cantidadTotal - cantidad);
    }

    public BigDecimal getTarifa() {
        return tarifa;
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
