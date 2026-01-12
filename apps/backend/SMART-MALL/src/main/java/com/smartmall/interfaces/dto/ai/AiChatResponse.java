package com.smartmall.interfaces.dto.ai;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import java.util.List;
import java.util.Map;

/**
 * AI 聊天响应 DTO
 */
@Data
@Schema(description = "AI 聊天响应")
public class AiChatResponse {
    
    @Schema(description = "请求 ID")
    private String requestId;
    
    @Schema(description = "响应类型", example = "text")
    private String type;
    
    @Schema(description = "响应内容")
    private String content;
    
    @Schema(description = "响应消息（用于确认类型）")
    private String message;
    
    @Schema(description = "操作名称（需要确认时）")
    private String action;
    
    @Schema(description = "操作参数")
    private Map<String, Object> args;
    
    @Schema(description = "工具调用结果")
    private List<ToolResult> toolResults;
    
    @Schema(description = "意图类型")
    private String intent;
    
    @Schema(description = "置信度")
    private Double confidence;
    
    @Schema(description = "建议操作")
    private List<String> suggestions;
    
    @Schema(description = "导航目标路径")
    private String navigateTo;
    
    @Schema(description = "导航目标标签")
    private String navigateLabel;
    
    @Schema(description = "时间戳")
    private String timestamp;
    
    /**
     * 工具调用结果
     */
    @Data
    public static class ToolResult {
        private String function;
        private Map<String, Object> args;
        private Map<String, Object> result;
    }
}
