package com.sporthub.auth.mfa;

import com.sporthub.user.UserAccount;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Almacenamiento efímero de OTP por correo (en memoria, TTL corto). El código se guarda
 * hashado (SHA-256) y es de un solo uso.
 */
@Service
public class MfaOtpService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final ConcurrentHashMap<String, OtpEntry> codes = new ConcurrentHashMap<>();

    @Value("${sporthub.mfa.email.otp-ttl-seconds:300}")
    private long ttlSeconds;

    public String generate(UserAccount user) {
        String code = String.format("%06d", RANDOM.nextInt(1_000_000));
        codes.put(user.getId().toString(), new OtpEntry(
                sha256(code), System.currentTimeMillis() + ttlSeconds * 1000L));
        return code;
    }

    public boolean verify(UserAccount user, String code) {
        OtpEntry entry = codes.get(user.getId().toString());
        if (entry == null || code == null) {
            return false;
        }
        if (entry.expiresAtMs < System.currentTimeMillis()) {
            codes.remove(user.getId().toString());
            return false;
        }
        if (!MessageDigest.isEqual(entry.codeHash, sha256(code))) {
            return false;
        }
        codes.remove(user.getId().toString());
        return true;
    }

    public void clear(String userId) {
        codes.remove(userId);
    }

    private static byte[] sha256(String value) {
        try {
            return MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 no disponible", e);
        }
    }

    private record OtpEntry(byte[] codeHash, long expiresAtMs) {}
}