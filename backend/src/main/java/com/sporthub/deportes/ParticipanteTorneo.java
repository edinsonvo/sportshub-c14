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
@Table(name = "participante_torneo")
public class ParticipanteTorneo {

    @Id
    @UuidGenerator
    private UUID id;

    @Column(name = "torneo_id", nullable = false)
    private UUID torneoId;

    @Column(name = "client_id", nullable = false)
    private UUID clientId;

    @Column(name = "nombre_equipo", length = 120)
    private String nombreEquipo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ParticipanteEstado estado;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    protected ParticipanteTorneo() {}

    public ParticipanteTorneo(UUID torneoId, UUID clientId, String nombreEquipo) {
        this.torneoId = torneoId;
        this.clientId = clientId;
        this.nombreEquipo = nombreEquipo;
        this.estado = ParticipanteEstado.INSCRITO;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getTorneoId() {
        return torneoId;
    }

    public UUID getClientId() {
        return clientId;
    }

    public String getNombreEquipo() {
        return nombreEquipo;
    }

    public ParticipanteEstado getEstado() {
        return estado;
    }

    public void setEstado(ParticipanteEstado estado) {
        this.estado = estado;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
