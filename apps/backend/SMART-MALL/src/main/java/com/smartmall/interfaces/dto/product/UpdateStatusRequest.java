package com.smartmall.interfaces.dto.product;

import com.smartmall.domain.enums.ProductStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 更新商品状态请求
 */
@Data
public class UpdateStatusRequest {
    
    /**
     * 目标状态
     */
    @NotNull(message = "状态不能为空")
    private ProductStatus status;
}
