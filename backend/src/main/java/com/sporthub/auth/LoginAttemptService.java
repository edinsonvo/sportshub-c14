package com.sporthub.auth;

import com.sporthub.infra.BusinessException;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

/**
 * Bloqueo ante intentos fallidos (lineamiento 6.2). En producción puede persistirse en BD.
 */
@Service
public class LoginAttemptService {

    private final ConcurrentHashMap<String, Attempt> attempts = new ConcurrentHashMap<>();

    @Value("${app.security.max-attempts:5}")
    private int maxAttempts;

    @Value("${app.security.lockout-minutes:30}")
    private long lockoutMinutes;

    public void registerFailure(String email) {
        Attempt attempt = attempts.computeIfAbsent(email.toLowerCase(), k -> new Attempt());
        attempt.count++;
        attempt.firstFailureAt = System.currentTimeMillis();
    }

    public void reset(String email) {
        attempts.remove(email.toLowerCase());
    }

    public void checkBlocked(String email) {
        Attempt attempt = attempts.get(email.toLowerCase());
        if (attempt != null && attempt.count >= maxAttempts) {
            long elapsed = System.currentTimeMillis() - attempt.firstFailureAt;
            if (elapsed < lockoutMinutes * 60_000L) {
                throw new BusinessException(
                        "CUENTA_BLOQUEADA", "Cuenta bloqueada por múltiples intentos fallidos", HttpStatus.LOCKED);
            }
            attempts.remove(email.toLowerCase());
        }
    }

    public boolean isBlocked(String email) {
        try {
            checkBlocked(email);
            return false;
        } catch (BusinessException e) {
            return true;
        }
    }

    private static final class Attempt {
        int count;
        long firstFailureAt;
    }
}
