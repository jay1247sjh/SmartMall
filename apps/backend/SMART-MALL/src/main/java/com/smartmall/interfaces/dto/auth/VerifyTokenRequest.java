package com.smartmall.interfaces.dto.auth;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 验证重置令牌请求
 */
@Data
public class VerifyTokenRequest {
    
    @NotBlank(message = "令牌不能为空")
    private String token;
}
