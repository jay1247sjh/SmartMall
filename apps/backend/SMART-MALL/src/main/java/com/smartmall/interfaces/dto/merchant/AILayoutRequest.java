package com.smartmall.interfaces.dto.merchant;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * AI 店铺布局生成请求 DTO
 */
@Data
@Schema(description = "AI 店铺布局生成请求")
public class AILayoutRequest {

    @Schema(description = "店铺主题", example = "japanese_cafe")
    @NotBlank(message = "店铺主题不能为空")
    private String theme;
}
