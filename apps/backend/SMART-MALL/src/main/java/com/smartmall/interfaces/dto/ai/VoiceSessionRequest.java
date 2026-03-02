package com.smartmall.interfaces.dto.ai;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

/**
 * 语音会话创建请求
 */
@Data
@Schema(description = "语音会话创建请求")
public class VoiceSessionRequest {

    @Schema(description = "业务场景标识（可选）", example = "ai-assistant")
    private String scene;

    @Schema(description = "语音语言（可选）", example = "zh-CN")
    private String language;
}

