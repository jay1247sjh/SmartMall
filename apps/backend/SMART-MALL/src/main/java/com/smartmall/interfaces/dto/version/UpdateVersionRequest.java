package com.smartmall.interfaces.dto.version;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 更新版本描述请求
 */
@Data
public class UpdateVersionRequest {

    @NotBlank(message = "描述不能为空")
    private String description;
}
