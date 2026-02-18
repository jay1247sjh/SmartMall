package com.smartmall.infrastructure.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartmall.common.response.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.Map;
import java.util.concurrent.TimeUnit;

/**
 * 基于 Redis + IP 地址的频率限制拦截器
 * 
 * 支持为不同路径配置不同的限制规则：
 * - POST /auth/register: 同一 IP，1 小时内最多 10 次
 * - GET /auth/check-username: 同一 IP，1 分钟内最多 30 次
 * - GET /auth/check-email: 同一 IP，1 分钟内最多 30 次
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class RateLimitInterceptor implements HandlerInterceptor {

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    private record RateLimitConfig(int maxRequests, long windowSeconds) {}

    private static final Map<String, RateLimitConfig> RATE_LIMIT_CONFIGS = Map.of(
        "/auth/register", new RateLimitConfig(10, 3600),
        "/auth/check-username", new RateLimitConfig(30, 60),
        "/auth/check-email", new RateLimitConfig(30, 60)
    );

    @Override
    public boolean preHandle(HttpServletRequest request,
                             HttpServletResponse response,
                             Object handler) throws Exception {
        String ip = getClientIp(request);
        String uri = request.getRequestURI();

        RateLimitConfig config = RATE_LIMIT_CONFIGS.get(uri);
        if (config == null) {
            return true;
        }

        String key = "rate_limit:" + uri + ":" + ip;
        Long count = redisTemplate.opsForValue().increment(key);

        if (count != null && count == 1) {
            redisTemplate.expire(key, config.windowSeconds(), TimeUnit.SECONDS);
        }

        if (count != null && count > config.maxRequests()) {
            log.warn("频率限制触发 - IP: {}, URI: {}, count: {}", ip, uri, count);
            response.setStatus(429);
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write(
                objectMapper.writeValueAsString(
                    ApiResponse.error("A1004", "请求过于频繁，请稍后再试")
                )
            );
            return false;
        }

        return true;
    }

    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
