package com.smartmall.interfaces.controller;

import com.smartmall.common.response.ApiResponse;
import com.smartmall.infrastructure.service.VoiceSessionTokenService;
import com.smartmall.interfaces.dto.ai.VoiceSessionRequest;
import com.smartmall.interfaces.dto.ai.VoiceSessionResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

/**
 * AI 语音会话控制器
 */
@Slf4j
@Tag(name = "AI 语音", description = "AI 语音会话管理")
@RestController
@RequestMapping("/ai/voice")
@RequiredArgsConstructor
public class AiVoiceController {

    private final VoiceSessionTokenService voiceSessionTokenService;

    @Operation(summary = "创建语音会话")
    @PostMapping("/session")
    public ApiResponse<VoiceSessionResponse> createSession(@RequestBody(required = false) VoiceSessionRequest request) {
        String userId = getCurrentUserId();
        String language = request != null ? request.getLanguage() : null;
        String scene = request != null ? request.getScene() : null;

        log.info("Create voice session for user {} (language={}, scene={})", userId, language, scene);
        VoiceSessionResponse response = voiceSessionTokenService.createSession(userId, language, scene);
        return ApiResponse.success(response);
    }

    private String getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            return auth.getName();
        }
        return "anonymous";
    }
}

