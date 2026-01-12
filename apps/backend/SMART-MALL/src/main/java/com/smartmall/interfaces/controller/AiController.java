package com.smartmall.interfaces.controller;

import com.smartmall.common.response.ApiResponse;
import com.smartmall.infrastructure.service.IntelligenceServiceClient;
import com.smartmall.interfaces.dto.ai.AiChatRequest;
import com.smartmall.interfaces.dto.ai.AiChatResponse;
import com.smartmall.interfaces.dto.ai.AiConfirmRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * AI 助手控制器
 * 
 * 提供 AI 聊天、意图识别等功能
 * 作为前端与 Intelligence Service (Python) 之间的代理
 */
@Slf4j
@Tag(name = "AI 助手", description = "AI 聊天与意图识别")
@RestController
@RequestMapping("/ai")
@RequiredArgsConstructor
public class AiController {
    
    private final IntelligenceServiceClient intelligenceServiceClient;
    
    @Operation(summary = "发送聊天消息")
    @PostMapping("/chat")
    public ApiResponse<AiChatResponse> chat(@Valid @RequestBody AiChatRequest request) {
        String userId = getCurrentUserId();
        String userRole = getCurrentUserRole();
        log.info("AI chat request from user {} (role: {}): {}", userId, userRole, request.getMessage());
        
        AiChatResponse response = intelligenceServiceClient.chat(
            userId,
            userRole,
            request.getMessage(),
            request.getImageUrl(),
            request.getCurrentPage(),
            request.getCurrentFloor(),
            request.getPositionX(),
            request.getPositionY(),
            request.getPositionZ()
        );
        
        return ApiResponse.success(response);
    }
    
    @Operation(summary = "确认操作")
    @PostMapping("/confirm")
    public ApiResponse<AiChatResponse> confirm(@Valid @RequestBody AiConfirmRequest request) {
        String userId = getCurrentUserId();
        log.info("AI confirm request from user {}: action={}, confirmed={}", 
                 userId, request.getAction(), request.getConfirmed());
        
        AiChatResponse response = intelligenceServiceClient.confirm(
            userId,
            request.getAction(),
            request.getArgs(),
            request.getConfirmed()
        );
        
        return ApiResponse.success(response);
    }
    
    @Operation(summary = "AI 服务健康检查")
    @GetMapping("/health")
    public ApiResponse<Map<String, Object>> health() {
        boolean isHealthy = intelligenceServiceClient.healthCheck();
        
        Map<String, Object> data = new HashMap<>();
        data.put("status", isHealthy ? "UP" : "DOWN");
        data.put("service", "intelligence");
        data.put("timestamp", System.currentTimeMillis());
        
        return ApiResponse.success(data);
    }
    
    /**
     * 获取当前用户 ID
     */
    private String getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            return auth.getName();
        }
        return "anonymous";
    }
    
    /**
     * 获取当前用户角色
     */
    private String getCurrentUserRole() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated()) {
            return auth.getAuthorities().stream()
                .map(a -> a.getAuthority())
                .filter(a -> a.startsWith("ROLE_"))
                .map(a -> a.substring(5)) // 去掉 "ROLE_" 前缀
                .findFirst()
                .orElse("USER");
        }
        return "USER";
    }
}
