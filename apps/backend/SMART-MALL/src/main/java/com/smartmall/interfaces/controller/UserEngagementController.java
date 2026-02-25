package com.smartmall.interfaces.controller;

import com.smartmall.application.service.UserEngagementService;
import com.smartmall.common.response.ApiResponse;
import com.smartmall.interfaces.dto.user.CreateUserOrderRequest;
import com.smartmall.interfaces.dto.user.UserCouponDTO;
import com.smartmall.interfaces.dto.user.UserOrderDTO;
import com.smartmall.interfaces.dto.user.UserStoreBriefDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 用户互动控制器
 */
@Tag(name = "用户互动", description = "收藏、浏览、订单、优惠券等用户互动接口")
@RestController
@RequestMapping("/user")
@RequiredArgsConstructor
@PreAuthorize("hasRole('USER')")
public class UserEngagementController {

    private final UserEngagementService userEngagementService;

    @Operation(summary = "获取可互动店铺列表（营业中）")
    @GetMapping("/stores/active")
    public ApiResponse<List<UserStoreBriefDTO>> getActiveStores(
            @RequestParam(value = "limit", defaultValue = "20") int limit) {
        return ApiResponse.success(userEngagementService.getActiveStores(limit));
    }

    @Operation(summary = "获取我的收藏店铺ID列表")
    @GetMapping("/favorites")
    public ApiResponse<List<String>> getFavorites(Authentication authentication) {
        String userId = authentication.getName();
        return ApiResponse.success(userEngagementService.getFavoriteStoreIds(userId));
    }

    @Operation(summary = "收藏店铺（幂等）")
    @PostMapping("/favorites/{storeId}")
    public ApiResponse<Void> addFavorite(
            Authentication authentication,
            @PathVariable String storeId) {
        String userId = authentication.getName();
        userEngagementService.addFavorite(userId, storeId);
        return ApiResponse.success(null);
    }

    @Operation(summary = "取消收藏店铺")
    @DeleteMapping("/favorites/{storeId}")
    public ApiResponse<Void> removeFavorite(
            Authentication authentication,
            @PathVariable String storeId) {
        String userId = authentication.getName();
        userEngagementService.removeFavorite(userId, storeId);
        return ApiResponse.success(null);
    }

    @Operation(summary = "记录店铺浏览")
    @PostMapping("/history/store/{storeId}")
    public ApiResponse<Void> recordBrowse(
            Authentication authentication,
            @PathVariable String storeId) {
        String userId = authentication.getName();
        userEngagementService.recordBrowse(userId, storeId);
        return ApiResponse.success(null);
    }

    @Operation(summary = "创建订单（MVP）")
    @PostMapping("/orders")
    public ApiResponse<UserOrderDTO> createOrder(
            Authentication authentication,
            @Valid @RequestBody(required = false) CreateUserOrderRequest request) {
        String userId = authentication.getName();
        return ApiResponse.success(userEngagementService.createOrder(userId, request));
    }

    @Operation(summary = "获取我的订单")
    @GetMapping("/orders")
    public ApiResponse<List<UserOrderDTO>> getOrders(
            Authentication authentication,
            @RequestParam(value = "limit", defaultValue = "20") int limit) {
        String userId = authentication.getName();
        return ApiResponse.success(userEngagementService.getOrders(userId, limit));
    }

    @Operation(summary = "领取优惠券（MVP）")
    @PostMapping("/coupons/claim")
    public ApiResponse<UserCouponDTO> claimCoupon(Authentication authentication) {
        String userId = authentication.getName();
        return ApiResponse.success(userEngagementService.claimCoupon(userId));
    }

    @Operation(summary = "使用优惠券")
    @PostMapping("/coupons/{couponId}/use")
    public ApiResponse<UserCouponDTO> useCoupon(
            Authentication authentication,
            @PathVariable String couponId) {
        String userId = authentication.getName();
        return ApiResponse.success(userEngagementService.useCoupon(userId, couponId));
    }

    @Operation(summary = "获取我的优惠券")
    @GetMapping("/coupons")
    public ApiResponse<List<UserCouponDTO>> getCoupons(
            Authentication authentication,
            @RequestParam(value = "limit", defaultValue = "20") int limit) {
        String userId = authentication.getName();
        return ApiResponse.success(userEngagementService.getCoupons(userId, limit));
    }
}
