package com.sporthub.auth.mfa;

import java.net.URLEncoder;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.SecureRandom;
import java.util.Arrays;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

/**
 * TOTP (RFC 6238) sin dependencias externas: secreto Base32, HMAC-SHA1, 6 dígitos, periodo 30 s.
 */
public final class Totp {

    static final String BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    private static final int SECRET_BYTES = 20;
    private static final int DEFAULT_PERIOD_SECONDS = 30;
    private static final int DEFAULT_DRIFT = 1;

    private Totp() {}

    public static String generateSecret() {
        byte[] bytes = new byte[SECRET_BYTES];
        new SecureRandom().nextBytes(bytes);
        return base32Encode(bytes);
    }

    public static String generateCode(String base32Secret) {
        long counter = currentCounter(DEFAULT_PERIOD_SECONDS);
        return toDigits(dynamicTruncation(hmacSha1(decodeBase32(base32Secret), counter)));
    }

    public static boolean verify(String base32Secret, String code) {
        return verify(base32Secret, code, DEFAULT_DRIFT);
    }

    public static boolean verify(String base32Secret, String code, int allowedWindow) {
        if (base32Secret == null || code == null || allowedWindow < 0 || !code.matches("\\d{6}")) {
            return false;
        }
        byte[] secret = decodeBase32(base32Secret);
        long counter = currentCounter(DEFAULT_PERIOD_SECONDS);
        for (int i = -allowedWindow; i <= allowedWindow; i++) {
            if (toDigits(dynamicTruncation(hmacSha1(secret, counter + i))).equals(code)) {
                return true;
            }
        }
        return false;
    }

    public static String otpauthUri(String issuer, String email, String base32Secret) {
        return "otpauth://totp/" + urlEncode(issuer + ":" + email)
                + "?secret=" + base32Secret
                + "&issuer=" + urlEncode(issuer)
                + "&period=" + DEFAULT_PERIOD_SECONDS
                + "&digits=6"
                + "&algorithm=SHA1";
    }

    private static long currentCounter(int periodSeconds) {
        return System.currentTimeMillis() / 1000L / periodSeconds;
    }

    private static byte[] hmacSha1(byte[] secret, long counter) {
        try {
            Mac mac = Mac.getInstance("HmacSHA1");
            mac.init(new SecretKeySpec(secret, "HmacSHA1"));
            return mac.doFinal(ByteBuffer.allocate(8).putLong(counter).array());
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("Fallo al calcular HMAC-SHA1", e);
        }
    }

    private static int dynamicTruncation(byte[] hmac) {
        int offset = hmac[hmac.length - 1] & 0x0f;
        return ((hmac[offset] & 0x7f) << 24)
                | ((hmac[offset + 1] & 0xff) << 16)
                | ((hmac[offset + 2] & 0xff) << 8)
                | (hmac[offset + 3] & 0xff);
    }

    private static String toDigits(int value) {
        return String.format("%06d", value % 1_000_000);
    }

    private static String urlEncode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8).replace("+", "%20");
    }

    static String base32Encode(byte[] data) {
        StringBuilder sb = new StringBuilder();
        int value = 0;
        int bits = 0;
        for (byte b : data) {
            value = (value << 8) | (b & 0xff);
            bits += 8;
            while (bits >= 5) {
                sb.append(BASE32_ALPHABET.charAt((value >> (bits - 5)) & 0x1f));
                bits -= 5;
            }
        }
        if (bits > 0) {
            sb.append(BASE32_ALPHABET.charAt((value << (5 - bits)) & 0x1f));
        }
        while (sb.length() % 8 != 0) {
            sb.append('=');
        }
        return sb.toString();
    }

    static byte[] decodeBase32(String encoded) {
        String s = encoded.replace("=", "").replaceAll("\\s", "").toUpperCase();
        if (s.isEmpty()) {
            throw new IllegalArgumentException("Secreto Base32 vacío");
        }
        byte[] out = new byte[(s.length() * 5 + 7) / 8];
        int buffer = 0;
        int bitsLeft = 0;
        int index = 0;
        for (char c : s.toCharArray()) {
            int val = BASE32_ALPHABET.indexOf(c);
            if (val < 0) {
                throw new IllegalArgumentException("Carácter Base32 inválido: " + c);
            }
            buffer = (buffer << 5) | val;
            bitsLeft += 5;
            if (bitsLeft >= 8) {
                out[index++] = (byte) ((buffer >> (bitsLeft - 8)) & 0xff);
                bitsLeft -= 8;
            }
        }
        return Arrays.copyOf(out, index);
    }
}
