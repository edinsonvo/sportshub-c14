package com.sporthub.infra;

import java.time.Instant;
import java.util.List;

/**
 * Cuerpo de error uniforme (lineamiento 3.3): errorCode, message, details y traceId.
 */
public record ErrorResponse(String errorCode, String message, List<String> details, String traceId, Instant timestamp) {

    public static ErrorResponse of(String errorCode, String message, List<String> details, String traceId) {
        return new ErrorResponse(errorCode, message, details, traceId, Instant.now());
    }
}
