package com.smartmall.interfaces.dto.ai;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

/**
 * 语音会话创建响应
 */
@Data
@Schema(description = "语音会话创建响应")
public class VoiceSessionResponse {

    @Schema(description = "语音会话 ID", example = "vsn_abc123")
    private String sessionId;

    @Schema(description = "语音 WebSocket 地址")
    private String wsUrl;

    @Schema(description = "过期时间（ISO8601 UTC）", example = "2026-03-01T10:00:00Z")
    private String expiresAt;
}

