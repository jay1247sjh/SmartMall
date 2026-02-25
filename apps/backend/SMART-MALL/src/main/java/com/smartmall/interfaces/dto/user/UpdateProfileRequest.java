package com.smartmall.interfaces.dto.user;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 更新用户资料请求
 */
@Data
public class UpdateProfileRequest {

    @Schema(description = "邮箱", example = "user@smartmall.com")
    @Email(message = "邮箱格式不正确")
    @Size(max = 100, message = "邮箱长度不能超过100")
    private String email;

    @Schema(description = "手机号", example = "13800000000")
    @Size(max = 20, message = "手机号长度不能超过20")
    private String phone;
}
