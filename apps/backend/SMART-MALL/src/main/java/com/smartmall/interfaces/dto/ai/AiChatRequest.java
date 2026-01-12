package com.smartmall.interfaces.dto.ai;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * AI 聊天请求 DTO
 */
@Data
@Schema(description = "AI 聊天请求")
public class AiChatRequest {
    
    @Schema(description = "用户消息", example = "Nike 店在哪？")
    @NotBlank(message = "消息不能为空")
    private String message;
    
    @Schema(description = "图片 URL（可选）")
    private String imageUrl;
    
    @Schema(description = "当前页面路径", example = "/admin/dashboard")
    private String currentPage;
    
    @Schema(description = "当前楼层")
    private String currentFloor;
    
    @Schema(description = "当前位置 X")
    private Double positionX;
    
    @Schema(description = "当前位置 Y")
    private Double positionY;
    
    @Schema(description = "当前位置 Z")
    private Double positionZ;
}
