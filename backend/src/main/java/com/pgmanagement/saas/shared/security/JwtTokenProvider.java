package com.pgmanagement.saas.shared.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.UnsupportedJwtException;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.MacAlgorithm;
import io.jsonwebtoken.security.SignatureException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.UUID;

/**
 * Cryptographic JWT issuer and validator with strict ACCESS vs REFRESH token-type binding.
 */
@Component
@Slf4j
public class JwtTokenProvider {

    private static final String CLAIM_TYPE = "type";
    private static final String TYPE_ACCESS = "ACCESS";
    private static final String TYPE_REFRESH = "REFRESH";

    private final SecretKey key;
    private final MacAlgorithm algorithm;
    private final long accessExpirationMs;
    private final long refreshExpirationMs;

    public JwtTokenProvider(
            @Value("${app.security.jwt.secret}") String jwtSecret,
            @Value("${app.security.jwt.expiration-ms:900000}") long accessExpirationMs,
            @Value("${app.security.jwt.refresh-expiration-ms:604800000}") long refreshExpirationMs) {

        if (!StringUtils.hasText(jwtSecret)) {
            throw new IllegalStateException("JWT_SECRET environment variable must be configured");
        }
        byte[] keyBytes = Decoders.BASE64.decode(jwtSecret.trim());
        if (keyBytes.length < 32) {
            throw new IllegalStateException("JWT_SECRET must decode to at least 256 bits (32 bytes)");
        }
        this.key = Keys.hmacShaKeyFor(keyBytes);
        this.algorithm = keyBytes.length >= 64 ? Jwts.SIG.HS512 : Jwts.SIG.HS256;
        this.accessExpirationMs = accessExpirationMs;
        this.refreshExpirationMs = refreshExpirationMs;
    }

    public String generateAccessToken(UserPrincipal principal) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + accessExpirationMs);

        return Jwts.builder()
                .subject(principal.getId().toString())
                .claim(CLAIM_TYPE, TYPE_ACCESS)
                .claim("role", principal.getRole().name())
                .issuedAt(now)
                .expiration(expiry)
                .signWith(key, algorithm)
                .compact();
    }

    public String generateRefreshToken(UUID userId) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + refreshExpirationMs);

        return Jwts.builder()
                .id(UUID.randomUUID().toString())
                .subject(userId.toString())
                .claim(CLAIM_TYPE, TYPE_REFRESH)
                .issuedAt(now)
                .expiration(expiry)
                .signWith(key, algorithm)
                .compact();
    }

    public long getAccessExpirationMs() {
        return accessExpirationMs;
    }

    public long getRefreshExpirationMs() {
        return refreshExpirationMs;
    }

    public UUID getUserIdFromToken(String token) {
        return UUID.fromString(parseClaims(token).getSubject());
    }

    public boolean validateAccessToken(String token) {
        return validateTypedToken(token, TYPE_ACCESS);
    }

    public boolean validateRefreshToken(String token) {
        return validateTypedToken(token, TYPE_REFRESH);
    }

    private boolean validateTypedToken(String token, String expectedType) {
        try {
            Claims claims = parseClaims(token);
            return expectedType.equals(claims.get(CLAIM_TYPE, String.class));
        } catch (SignatureException ex) {
            log.warn("Invalid JWT signature");
        } catch (MalformedJwtException ex) {
            log.warn("Malformed JWT token");
        } catch (ExpiredJwtException ex) {
            log.debug("Expired JWT token");
        } catch (UnsupportedJwtException ex) {
            log.warn("Unsupported JWT token");
        } catch (IllegalArgumentException ex) {
            log.warn("Invalid JWT claims payload");
        }
        return false;
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
