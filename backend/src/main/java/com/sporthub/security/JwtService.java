package com.sporthub.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class JwtService {

    private final SecretKey key;
    private final long accessExpirationMs;
    private final long refreshExpirationMs;
    private final long mfaChallengeExpirationMs;

    public JwtService(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.access-expiration-ms:900000}") long accessExpirationMs,
            @Value("${app.jwt.refresh-expiration-ms:2592000000}") long refreshExpirationMs,
            @Value("${sporthub.mfa.challenge-expiration-ms:300000}") long mfaChallengeExpirationMs) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.accessExpirationMs = accessExpirationMs;
        this.refreshExpirationMs = refreshExpirationMs;
        this.mfaChallengeExpirationMs = mfaChallengeExpirationMs;
    }

    public String generateAccessToken(String email, UUID userId, String role) {
        return generate(email, userId, role, null, accessExpirationMs);
    }

    public String generateRefreshToken(String email, UUID userId, String role) {
        return generate(email, userId, role, null, refreshExpirationMs);
    }

    public String generateMfaChallenge(String email, UUID userId, String role) {
        return generate(email, userId, role, "mfa", mfaChallengeExpirationMs);
    }

    public boolean isMfaChallenge(String token) {
        return "mfa".equals(parse(token).get("type", String.class));
    }

    private String generate(String email, UUID userId, String role, String type, long expirationMs) {
        Date now = new Date();
        var builder = Jwts.builder()
                .subject(email)
                .claim("uid", userId.toString())
                .claim("role", role)
                .issuedAt(now)
                .expiration(new Date(now.getTime() + expirationMs))
                .signWith(key);
        if (type != null) {
            builder.claim("type", type);
        }
        return builder.compact();
    }

    public Claims parse(String token) {
        return Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
    }

    public String extractEmail(String token) {
        return parse(token).getSubject();
    }
}
