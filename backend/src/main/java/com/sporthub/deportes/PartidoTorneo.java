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
@Table(name = "partido_torneo")
public class PartidoTorneo {

    @Id
    @UuidGenerator
    private UUID id;

    @Column(name = "torneo_id", nullable = false)
    private UUID torneoId;

    @Column(nullable = false)
    private int ronda;

    @Column(name = "participante_a_id", nullable = false)
    private UUID participanteAId;

    @Column(name = "participante_b_id", nullable = false)
    private UUID participanteBId;

    @Column(nullable = false)
    private LocalDate fecha;

    @Column(name = "marcador_a")
    private Integer marcadorA;

    @Column(name = "marcador_b")
    private Integer marcadorB;

    @Column(name = "ganador_id")
    private UUID ganadorId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PartidoEstado estado;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    protected PartidoTorneo() {}

    public PartidoTorneo(UUID torneoId, int ronda, UUID participanteAId, UUID participanteBId, LocalDate fecha) {
        this.torneoId = torneoId;
        this.ronda = ronda;
        this.participanteAId = participanteAId;
        this.participanteBId = participanteBId;
        this.fecha = fecha;
        this.estado = PartidoEstado.PROGRAMADO;
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

    public int getRonda() {
        return ronda;
    }

    public UUID getParticipanteAId() {
        return participanteAId;
    }

    public UUID getParticipanteBId() {
        return participanteBId;
    }

    public LocalDate getFecha() {
        return fecha;
    }

    public Integer getMarcadorA() {
        return marcadorA;
    }

    public Integer getMarcadorB() {
        return marcadorB;
    }

    public UUID getGanadorId() {
        return ganadorId;
    }

    public PartidoEstado getEstado() {
        return estado;
    }

    public void registrarResultado(int a, int b) {
        this.marcadorA = a;
        this.marcadorB = b;
        if (a > b) {
            this.ganadorId = participanteAId;
        } else if (b > a) {
            this.ganadorId = participanteBId;
        } else {
            this.ganadorId = null;
        }
        this.estado = PartidoEstado.JUGADO;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
