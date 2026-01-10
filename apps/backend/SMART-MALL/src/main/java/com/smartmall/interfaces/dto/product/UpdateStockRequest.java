package com.smartmall.interfaces.dto.product;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 更新库存请求
 */
@Data
public class UpdateStockRequest {
    
    /**
     * 库存数量
     */
    @NotNull(message = "库存不能为空")
    @Min(value = 0, message = "库存不能为负数")
    private Integer stock;
}
