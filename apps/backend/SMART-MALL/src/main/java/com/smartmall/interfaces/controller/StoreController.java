package com.smartmall.interfaces.controller;

import com.smartmall.application.service.StoreService;
import com.smartmall.common.response.ApiResponse;
import com.smartmall.interfaces.dto.store.CreateStoreRequest;
import com.smartmall.interfaces.dto.store.StoreDTO;
import com.smartmall.interfaces.dto.store.UpdateStoreRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 店铺控制器（商家端）
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/store")
public class StoreController {
    
    private final StoreService storeService;
    
    /**
     * 创建店铺
     */
    @PostMapping
    @PreAuthorize("hasRole('MERCHANT')")
    public ApiResponse<StoreDTO> createStore(
            @Valid @RequestBody CreateStoreRequest request,
            Authentication authentication) {
        String merchantId = authentication.getName();
        StoreDTO result = storeService.createStore(merchantId, request);
        return ApiResponse.success(result);
    }
    
    /**
     * 获取我的店铺列表
     */
    @GetMapping("/my")
    @PreAuthorize("hasRole('MERCHANT')")
    public ApiResponse<List<StoreDTO>> getMyStores(Authentication authentication) {
        String merchantId = authentication.getName();
        List<StoreDTO> stores = storeService.getMyStores(merchantId);
        return ApiResponse.success(stores);
    }
    
    /**
     * 获取店铺详情
     */
    @GetMapping("/{storeId}")
    public ApiResponse<StoreDTO> getStoreById(@PathVariable String storeId) {
        StoreDTO store = storeService.getStoreById(storeId);
        return ApiResponse.success(store);
    }
    
    /**
     * 更新店铺信息
     */
    @PutMapping("/{storeId}")
    @PreAuthorize("hasRole('MERCHANT')")
    public ApiResponse<StoreDTO> updateStore(
            @PathVariable String storeId,
            @Valid @RequestBody UpdateStoreRequest request,
            Authentication authentication) {
        String merchantId = authentication.getName();
        StoreDTO result = storeService.updateStore(merchantId, storeId, request);
        return ApiResponse.success(result);
    }
    
    /**
     * 激活店铺（INACTIVE -> ACTIVE）
     */
    @PostMapping("/{storeId}/activate")
    @PreAuthorize("hasRole('MERCHANT')")
    public ApiResponse<Void> activateStore(
            @PathVariable String storeId,
            Authentication authentication) {
        String merchantId = authentication.getName();
        storeService.activateStore(merchantId, storeId);
        return ApiResponse.success(null);
    }
    
    /**
     * 暂停营业（ACTIVE -> INACTIVE）
     */
    @PostMapping("/{storeId}/deactivate")
    @PreAuthorize("hasRole('MERCHANT')")
    public ApiResponse<Void> deactivateStore(
            @PathVariable String storeId,
            Authentication authentication) {
        String merchantId = authentication.getName();
        storeService.deactivateStore(merchantId, storeId);
        return ApiResponse.success(null);
    }
}
