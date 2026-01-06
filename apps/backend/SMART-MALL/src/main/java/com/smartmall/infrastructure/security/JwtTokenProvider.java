package com.smartmall.infrastructure.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SignatureException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Optional;

/**
 * JWT Token 提供者
 * 
 * 职责：
 * - 生成 AccessToken 和 RefreshToken
 * - 验证 Token 有效性
 * - 解析 Token 中的用户信息
 */
@Slf4j
@Component
public class JwtTokenProvider {

    private final SecretKey secretKey;
    private final long accessTokenExpiration;
    private final long refreshTokenExpiration;

    public JwtTokenProvider(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.access-token-expiration}") long accessTokenExpiration,
            @Value("${jwt.refresh-token-expiration}") long refreshTokenExpiration) {
        // 验证密钥长度（HMAC-SHA256 需要至少 256 位 = 32 字节）
        if (secret.length() < 32) {
            throw new IllegalArgumentException("JWT secret must be at least 32 characters long");
        }
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.accessTokenExpiration = accessTokenExpiration;
        this.refreshTokenExpiration = refreshTokenExpiration;
        
        log.info("JwtTokenProvider initialized: accessTokenExpiration={}ms, refreshTokenExpiration={}ms",
                accessTokenExpiration, refreshTokenExpiration);
    }

    /**
     * 生成 AccessToken
     */
    public String generateAccessToken(String userId, String username, String userType) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + accessTokenExpiration);

        String token = Jwts.builder()
                .subject(userId)
                .claim("username", username)
                .claim("userType", userType)
                .claim("tokenType", "access")
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(secretKey)
                .compact();
        
        log.debug("Generated access token for user: {}", userId);
        return token;
    }

    /**
     * 生成 RefreshToken
     */
    public String generateRefreshToken(String userId) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + refreshTokenExpiration);

        String token = Jwts.builder()
                .subject(userId)
                .claim("tokenType", "refresh")
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(secretKey)
                .compact();
        
        log.debug("Generated refresh token for user: {}", userId);
        return token;
    }

    /**
     * 从 Token 中获取用户ID
     * 
     * @return 用户ID，解析失败返回 empty
     */
    public Optional<String> getUserIdFromToken(String token) {
        return parseTokenSafely(token).map(Claims::getSubject);
    }

    /**
     * 从 Token 中获取用户ID（兼容旧接口）
     * 
     * @throws JwtException 如果 Token 无效
     */
    public String getUserIdFromToken(String token, boolean throwOnError) {
        if (throwOnError) {
            return parseToken(token).getSubject();
        }
        return getUserIdFromToken(token).orElse(null);
    }

    /**
     * 从 Token 中获取用户类型
     */
    public String getUserTypeFromToken(String token) {
        return parseTokenSafely(token)
                .map(claims -> claims.get("userType", String.class))
                .orElse(null);
    }

    /**
     * 验证 Token
     * 
     * @return 验证结果
     */
    public TokenValidationResult validateToken(String token) {
        if (token == null || token.isBlank()) {
            return TokenValidationResult.invalid("Token is empty");
        }
        
        try {
            Claims claims = parseToken(token);
            
            // 检查是否过期
            if (claims.getExpiration().before(new Date())) {
                return TokenValidationResult.expired();
            }
            
            return TokenValidationResult.valid();
        } catch (ExpiredJwtException e) {
            log.debug("Token expired: {}", e.getMessage());
            return TokenValidationResult.expired();
        } catch (SignatureException e) {
            log.warn("Invalid token signature: {}", e.getMessage());
            return TokenValidationResult.invalid("Invalid signature");
        } catch (MalformedJwtException e) {
            log.warn("Malformed token: {}", e.getMessage());
            return TokenValidationResult.invalid("Malformed token");
        } catch (UnsupportedJwtException e) {
            log.warn("Unsupported token: {}", e.getMessage());
            return TokenValidationResult.invalid("Unsupported token");
        } catch (IllegalArgumentException e) {
            log.warn("Invalid token argument: {}", e.getMessage());
            return TokenValidationResult.invalid("Invalid token");
        }
    }

    /**
     * 验证 Token（简化版，兼容旧接口）
     */
    public boolean validateToken(String token, boolean legacy) {
        return validateToken(token).isValid();
    }

    /**
     * 检查是否为 RefreshToken
     */
    public boolean isRefreshToken(String token) {
        return parseTokenSafely(token)
                .map(claims -> "refresh".equals(claims.get("tokenType", String.class)))
                .orElse(false);
    }

    /**
     * 获取 Token 剩余有效时间（毫秒）
     * 
     * @return 剩余时间，已过期返回 0，解析失败返回 -1
     */
    public long getTokenRemainingTime(String token) {
        return parseTokenSafely(token)
                .map(claims -> {
                    long expTime = claims.getExpiration().getTime();
                    long remaining = expTime - System.currentTimeMillis();
                    return Math.max(0, remaining);
                })
                .orElse(-1L);
    }

    /**
     * 解析 Token（抛出异常版本）
     */
    private Claims parseToken(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    /**
     * 安全解析 Token（不抛出异常）
     */
    private Optional<Claims> parseTokenSafely(String token) {
        try {
            return Optional.of(parseToken(token));
        } catch (JwtException | IllegalArgumentException e) {
            log.debug("Failed to parse token: {}", e.getMessage());
            return Optional.empty();
        }
    }

    /**
     * Token 验证结果
     * 
     * 【Java Record 说明】
     * Record 会自动生成与组件同名的访问器方法：
     * - valid() 返回 valid 字段
     * - expired() 返回 expired 字段
     * - message() 返回 message 字段
     * 
     * 为了避免与静态工厂方法 valid() 冲突，
     * 将字段名改为 isValid 和 isExpired
     */
    public record TokenValidationResult(boolean isValid, boolean isExpired, String message) {
        
        /**
         * 创建有效的验证结果
         */
        public static TokenValidationResult valid() {
            return new TokenValidationResult(true, false, null);
        }
        
        /**
         * 创建已过期的验证结果
         */
        public static TokenValidationResult expired() {
            return new TokenValidationResult(false, true, "Token expired");
        }
        
        /**
         * 创建无效的验证结果
         */
        public static TokenValidationResult invalid(String message) {
            return new TokenValidationResult(false, false, message);
        }
    }
}
