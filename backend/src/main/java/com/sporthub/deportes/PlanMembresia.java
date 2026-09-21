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
@Table(name = "plan_membresia")
public class PlanMembresia {

    @Id
    @UuidGenerator
    private UUID id;

    @Column(name = "provider_id", nullable = false)
    private UUID providerId;

    @Column(nullable = false, length = 160)
    private String nombre;

    @Column(name = "vigencia_dias", nullable = false)
    private int vigenciaDias;

    @Column(name = "descuento_porcentaje", nullable = false)
    private int descuentoPorcentaje;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal precio;

    @Column(length = 1000)
    private String beneficios;

    @Column(nullable = false)
    private boolean activo;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    protected PlanMembresia() {}

    public PlanMembresia(
            UUID providerId,
            String nombre,
            int vigenciaDias,
            int descuentoPorcentaje,
            BigDecimal precio,
            String beneficios) {
        this.providerId = providerId;
        this.nombre = nombre;
        this.vigenciaDias = vigenciaDias;
        this.descuentoPorcentaje = descuentoPorcentaje;
        this.precio = precio;
        this.beneficios = beneficios;
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

    public int getVigenciaDias() {
        return vigenciaDias;
    }

    public int getDescuentoPorcentaje() {
        return descuentoPorcentaje;
    }

    public BigDecimal getPrecio() {
        return precio;
    }

    public String getBeneficios() {
        return beneficios;
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
