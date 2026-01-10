package com.smartmall.interfaces.dto.permission;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 区域权限申请请求
 */
@Data
public class AreaApplyRequest {
    
    /**
     * 区域ID
     */
    @NotBlank(message = "区域ID不能为空")
    private String areaId;
    
    /**
     * 申请理由
     */
    private String applyReason;
}
