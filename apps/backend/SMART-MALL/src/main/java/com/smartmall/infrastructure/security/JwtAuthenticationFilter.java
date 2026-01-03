package com.smartmall.infrastructure.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

/**
 * JWT 认证过滤器
 * 
 * 职责：
 * - 从请求头提取 JWT Token
 * - 验证 Token 有效性
 * - 设置 Spring Security 认证上下文
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;
    
    private static final String AUTHORIZATION_HEADER = "Authorization";
    private static final String BEARER_PREFIX = "Bearer ";

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {
        
        try {
            String token = extractToken(request);
            
            if (StringUtils.hasText(token)) {
                JwtTokenProvider.TokenValidationResult validationResult = jwtTokenProvider.validateToken(token);
                
                if (validationResult.isValid()) {
                    setAuthentication(token);
                } else if (validationResult.isExpired()) {
                    log.debug("Token expired for request: {}", request.getRequestURI());
                } else {
                    log.debug("Invalid token for request: {}, reason: {}", 
                            request.getRequestURI(), validationResult.message());
                }
            }
        } catch (Exception e) {
            // 捕获所有异常，确保过滤器链继续执行
            // 认证失败会由 Spring Security 的 AuthenticationEntryPoint 处理
            log.error("Cannot set user authentication for request: {}", request.getRequestURI(), e);
            // 清除可能存在的认证信息
            SecurityContextHolder.clearContext();
        }

        filterChain.doFilter(request, response);
    }

    /**
     * 设置认证信息到 SecurityContext
     */
    private void setAuthentication(String token) {
        String userId = jwtTokenProvider.getUserIdFromToken(token)
                .orElse(null);
        String userType = jwtTokenProvider.getUserTypeFromToken(token);
        
        if (userId == null || userType == null) {
            log.warn("Token missing required claims: userId={}, userType={}", userId, userType);
            return;
        }
        
        // 创建认证对象
        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(
                        userId,
                        null,
                        Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + userType))
                );
        
        SecurityContextHolder.getContext().setAuthentication(authentication);
        log.debug("Set authentication for user: {}, role: {}", userId, userType);
    }

    /**
     * 从请求头提取 Token
     */
    private String extractToken(HttpServletRequest request) {
        String bearerToken = request.getHeader(AUTHORIZATION_HEADER);
        
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith(BEARER_PREFIX)) {
            return bearerToken.substring(BEARER_PREFIX.length()).trim();
        }
        
        return null;
    }

    /**
     * 判断是否需要跳过此过滤器
     * 可以在这里配置不需要认证的路径
     */
    @Override
    protected boolean shouldNotFilter(@NonNull HttpServletRequest request) {
        String path = request.getRequestURI();
        
        // 静态资源和公开接口跳过
        return path.startsWith("/swagger-ui") 
                || path.startsWith("/v3/api-docs")
                || path.startsWith("/actuator/health");
    }
}
