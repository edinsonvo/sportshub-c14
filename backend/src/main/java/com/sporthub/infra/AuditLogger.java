package com.sporthub.infra;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Registra acciones sensibles (RN-6) en AUDIT_LOG y emite un log estructurado para correlación.
 */
@Component
public class AuditLogger {

    private static final Logger log = LoggerFactory.getLogger(AuditLogger.class);

    private final AuditLogRepository repository;

    public AuditLogger(AuditLogRepository repository) {
        this.repository = repository;
    }

    public void record(String entityName, String entityId, String action, String actorId, String details) {
        repository.save(new AuditLog(entityName, entityId, action, actorId, details));
        log.info("audit event={} entity={} entityId={} actor={}", action, entityName, entityId, actorId);
    }
}
