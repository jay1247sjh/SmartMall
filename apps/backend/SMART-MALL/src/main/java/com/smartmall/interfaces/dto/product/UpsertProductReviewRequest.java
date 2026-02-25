package com.smartmall.interfaces.dto.product;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 用户创建/更新商品评价请求
 */
@Data
public class UpsertProductReviewRequest {

    /**
     * 评分（1-5）
     */
    @NotNull(message = "评分不能为空")
    @Min(value = 1, message = "评分最低为1分")
    @Max(value = 5, message = "评分最高为5分")
    private Integer rating;

    /**
     * 评价内容
     */
    @NotBlank(message = "评价内容不能为空")
    @Size(max = 500, message = "评价内容不能超过500个字符")
    private String content;
}

