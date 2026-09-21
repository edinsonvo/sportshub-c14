package com.sporthub.infra;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.UuidGenerator;

@Entity
@Table(name = "audit_log")
public class AuditLog {

    @Id
    @UuidGenerator
    private UUID id;

    @Column(name = "entity_name", nullable = false, length = 80)
    private String entityName;

    @Column(name = "entity_id", length = 64)
    private String entityId;

    @Column(nullable = false, length = 60)
    private String action;

    @Column(name = "actor_id", length = 64)
    private String actorId;

    @Column(columnDefinition = "text")
    private String details;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    protected AuditLog() {}

    public AuditLog(String entityName, String entityId, String action, String actorId, String details) {
        this.entityName = entityName;
        this.entityId = entityId;
        this.action = action;
        this.actorId = actorId;
        this.details = details;
    }
}
