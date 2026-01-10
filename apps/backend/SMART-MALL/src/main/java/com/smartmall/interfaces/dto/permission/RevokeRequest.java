package com.smartmall.interfaces.dto.permission;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 撤销权限请求
 */
@Data
public class RevokeRequest {
    
    /**
     * 撤销理由
     */
    @NotBlank(message = "撤销理由不能为空")
    private String reason;
}
