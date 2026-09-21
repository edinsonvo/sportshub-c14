package com.sporthub.deportes;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.UuidGenerator;

@Entity
@Table(name = "inscripcion_clase")
public class InscripcionClase {

    @Id
    @UuidGenerator
    private UUID id;

    @Column(name = "clase_grupal_id", nullable = false)
    private UUID claseGrupalId;

    @Column(name = "client_id", nullable = false)
    private UUID clientId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private InscripcionEstado estado;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    protected InscripcionClase() {}

    public InscripcionClase(UUID claseGrupalId, UUID clientId) {
        this.claseGrupalId = claseGrupalId;
        this.clientId = clientId;
        this.estado = InscripcionEstado.EN_ESPERA;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getClaseGrupalId() {
        return claseGrupalId;
    }

    public UUID getClientId() {
        return clientId;
    }

    public InscripcionEstado getEstado() {
        return estado;
    }

    public void setEstado(InscripcionEstado estado) {
        this.estado = estado;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
