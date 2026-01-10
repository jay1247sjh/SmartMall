package com.smartmall.interfaces.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.smartmall.application.service.StoreService;
import com.smartmall.common.response.ApiResponse;
import com.smartmall.interfaces.dto.store.CloseStoreRequest;
import com.smartmall.interfaces.dto.store.StoreDTO;
import com.smartmall.interfaces.dto.store.StoreQueryRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * 店铺管理控制器（管理员端）
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/admin/store")
@PreAuthorize("hasRole('ADMIN')")
public class AdminStoreController {
    
    private final StoreService storeService;
    
    /**
     * 获取所有店铺（分页）
     */
    @GetMapping
    public ApiResponse<IPage<StoreDTO>> getAllStores(
            StoreQueryRequest query,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        IPage<StoreDTO> stores = storeService.getAllStores(query, page, size);
        return ApiResponse.success(stores);
    }
    
    /**
     * 审批店铺（PENDING -> ACTIVE）
     */
    @PostMapping("/{storeId}/approve")
    public ApiResponse<Void> approveStore(
            @PathVariable String storeId,
            Authentication authentication) {
        String adminId = authentication.getName();
        storeService.approveStore(adminId, storeId);
        return ApiResponse.success(null);
    }
    
    /**
     * 关闭店铺
     */
    @PostMapping("/{storeId}/close")
    public ApiResponse<Void> closeStore(
            @PathVariable String storeId,
            @Valid @RequestBody CloseStoreRequest request,
            Authentication authentication) {
        String adminId = authentication.getName();
        storeService.closeStore(adminId, storeId, request.getReason());
        return ApiResponse.success(null);
    }
}
