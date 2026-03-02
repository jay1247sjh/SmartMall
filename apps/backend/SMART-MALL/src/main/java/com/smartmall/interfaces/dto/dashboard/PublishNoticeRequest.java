package com.smartmall.interfaces.dto.dashboard;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 发布系统公告请求
 */
@Data
public class PublishNoticeRequest {

    /**
     * 公告标题
     */
    @NotBlank(message = "公告标题不能为空")
    @Size(max = 200, message = "公告标题不能超过 200 个字符")
    private String title;

    /**
     * 公告内容
     */
    @NotBlank(message = "公告内容不能为空")
    @Size(max = 5000, message = "公告内容不能超过 5000 个字符")
    private String content;
}
