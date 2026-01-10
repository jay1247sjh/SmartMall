package com.smartmall.interfaces.dto.permission;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 驳回申请请求
 */
@Data
public class RejectRequest {
    
    /**
     * 驳回理由
     */
    @NotBlank(message = "驳回理由不能为空")
    private String reason;
}
