package com.smartmall.interfaces.dto.merchant;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 应用布局请求 DTO
 *
 * 商家确认 AI 生成的布局后，将布局数据持久化
 */
@Data
@Schema(description = "应用布局请求")
public class ApplyLayoutRequest {

    @Schema(description = "布局数据")
    @NotNull(message = "布局数据不能为空")
    private StoreLayoutResponse.StoreLayoutData layoutData;
}
