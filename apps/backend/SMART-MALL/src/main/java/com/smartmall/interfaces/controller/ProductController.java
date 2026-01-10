package com.smartmall.interfaces.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.smartmall.application.service.ProductService;
import com.smartmall.common.response.ApiResponse;
import com.smartmall.interfaces.dto.product.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * 商品控制器（商家端）
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/product")
public class ProductController {
    
    private final ProductService productService;
    
    /**
     * 创建商品
     */
    @PostMapping
    @PreAuthorize("hasRole('MERCHANT')")
    public ApiResponse<ProductDTO> createProduct(
            @Valid @RequestBody CreateProductRequest request,
            Authentication authentication) {
        String merchantId = authentication.getName();
        ProductDTO result = productService.createProduct(merchantId, request);
        return ApiResponse.success(result);
    }
    
    /**
     * 获取商品详情
     */
    @GetMapping("/{productId}")
    @PreAuthorize("hasRole('MERCHANT')")
    public ApiResponse<ProductDTO> getProduct(
            @PathVariable String productId,
            Authentication authentication) {
        String merchantId = authentication.getName();
        ProductDTO result = productService.getProduct(merchantId, productId);
        return ApiResponse.success(result);
    }
    
    /**
     * 更新商品
     */
    @PutMapping("/{productId}")
    @PreAuthorize("hasRole('MERCHANT')")
    public ApiResponse<ProductDTO> updateProduct(
            @PathVariable String productId,
            @Valid @RequestBody UpdateProductRequest request,
            Authentication authentication) {
        String merchantId = authentication.getName();
        ProductDTO result = productService.updateProduct(merchantId, productId, request);
        return ApiResponse.success(result);
    }

    
    /**
     * 删除商品
     */
    @DeleteMapping("/{productId}")
    @PreAuthorize("hasRole('MERCHANT')")
    public ApiResponse<Void> deleteProduct(
            @PathVariable String productId,
            Authentication authentication) {
        String merchantId = authentication.getName();
        productService.deleteProduct(merchantId, productId);
        return ApiResponse.success(null);
    }
    
    /**
     * 获取店铺商品列表
     */
    @GetMapping("/store/{storeId}")
    @PreAuthorize("hasRole('MERCHANT')")
    public ApiResponse<IPage<ProductDTO>> getStoreProducts(
            @PathVariable String storeId,
            @Valid ProductQueryRequest request,
            Authentication authentication) {
        String merchantId = authentication.getName();
        IPage<ProductDTO> result = productService.getStoreProducts(merchantId, storeId, request);
        return ApiResponse.success(result);
    }
    
    /**
     * 更新商品状态
     */
    @PostMapping("/{productId}/status")
    @PreAuthorize("hasRole('MERCHANT')")
    public ApiResponse<ProductDTO> updateProductStatus(
            @PathVariable String productId,
            @Valid @RequestBody UpdateStatusRequest request,
            Authentication authentication) {
        String merchantId = authentication.getName();
        ProductDTO result = productService.updateProductStatus(merchantId, productId, request.getStatus());
        return ApiResponse.success(result);
    }
    
    /**
     * 更新库存
     */
    @PostMapping("/{productId}/stock")
    @PreAuthorize("hasRole('MERCHANT')")
    public ApiResponse<ProductDTO> updateProductStock(
            @PathVariable String productId,
            @Valid @RequestBody UpdateStockRequest request,
            Authentication authentication) {
        String merchantId = authentication.getName();
        ProductDTO result = productService.updateProductStock(merchantId, productId, request.getStock());
        return ApiResponse.success(result);
    }
}
