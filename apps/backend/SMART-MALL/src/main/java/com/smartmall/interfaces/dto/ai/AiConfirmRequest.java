package com.smartmall.interfaces.dto.ai;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.Map;

/**
 * AI 操作确认请求 DTO
 */
@Data
@Schema(description = "AI 操作确认请求")
public class AiConfirmRequest {
    
    @Schema(description = "操作名称", example = "add_to_cart")
    @NotBlank(message = "操作名称不能为空")
    private String action;
    
    @Schema(description = "操作参数")
    private Map<String, Object> args;
    
    @Schema(description = "是否确认")
    @NotNull(message = "确认状态不能为空")
    private Boolean confirmed;
}
