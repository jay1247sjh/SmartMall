package com.smartmall.interfaces.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.smartmall.application.service.ProductService;
import com.smartmall.common.response.ApiResponse;
import com.smartmall.interfaces.dto.product.ProductDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * 商品控制器（公开端）
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/public")
public class PublicProductController {
    
    private final ProductService productService;
    
    /**
     * 获取店铺公开商品列表
     */
    @GetMapping("/store/{storeId}/products")
    public ApiResponse<IPage<ProductDTO>> getStoreProducts(
            @PathVariable String storeId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        IPage<ProductDTO> result = productService.getPublicStoreProducts(storeId, page, size);
        return ApiResponse.success(result);
    }
    
    /**
     * 获取商品公开详情
     */
    @GetMapping("/product/{productId}")
    public ApiResponse<ProductDTO> getProduct(@PathVariable String productId) {
        ProductDTO result = productService.getPublicProduct(productId);
        return ApiResponse.success(result);
    }
}
