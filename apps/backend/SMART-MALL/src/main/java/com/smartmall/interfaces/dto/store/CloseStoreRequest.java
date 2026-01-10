package com.smartmall.interfaces.dto.store;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 关闭店铺请求
 */
@Data
public class CloseStoreRequest {
    
    /**
     * 关闭原因
     */
    @NotBlank(message = "关闭原因不能为空")
    private String reason;
}
