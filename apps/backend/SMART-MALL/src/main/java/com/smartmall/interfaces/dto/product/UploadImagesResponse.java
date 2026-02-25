package com.smartmall.interfaces.dto.product;

import lombok.Data;

import java.util.List;

/**
 * 商品图片上传响应
 */
@Data
public class UploadImagesResponse {

    /**
     * 上传成功的图片URL列表
     */
    private List<String> urls;
}

