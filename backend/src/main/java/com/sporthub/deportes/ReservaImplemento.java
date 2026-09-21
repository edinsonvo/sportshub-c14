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
@Table(name = "reserva_implemento")
public class ReservaImplemento {

    @Id
    @UuidGenerator
    private UUID id;

    @Column(name = "implemento_id", nullable = false)
    private UUID implementoId;

    @Column(name = "client_id", nullable = false)
    private UUID clientId;

    @Column(nullable = false)
    private LocalDate fecha;

    @Column(nullable = false)
    private int cantidad;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ReservaImplementoEstado estado;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CondicionImplemento condicion;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    protected ReservaImplemento() {}

    public ReservaImplemento(UUID implementoId, UUID clientId, LocalDate fecha, int cantidad) {
        this.implementoId = implementoId;
        this.clientId = clientId;
        this.fecha = fecha;
        this.cantidad = cantidad;
        this.estado = ReservaImplementoEstado.RESERVADA;
        this.condicion = CondicionImplemento.BUENO;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getImplementoId() {
        return implementoId;
    }

    public UUID getClientId() {
        return clientId;
    }

    public LocalDate getFecha() {
        return fecha;
    }

    public int getCantidad() {
        return cantidad;
    }

    public ReservaImplementoEstado getEstado() {
        return estado;
    }

    public void setEstado(ReservaImplementoEstado estado) {
        this.estado = estado;
    }

    public CondicionImplemento getCondicion() {
        return condicion;
    }

    public void setCondicion(CondicionImplemento condicion) {
        this.condicion = condicion;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
