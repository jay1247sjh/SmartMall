package com.smartmall.interfaces.controller;

import com.smartmall.application.service.UserManageService;
import com.smartmall.common.response.ApiResponse;
import com.smartmall.interfaces.dto.user.UserDetailResponse;
import com.smartmall.interfaces.dto.user.UserListRequest;
import com.smartmall.interfaces.dto.user.UserListResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * 用户管理控制器（管理员端）
 *
 * 接口列表：
 * - GET  /admin/users           获取用户列表（分页、搜索、筛选）
 * - GET  /admin/users/{userId}  获取用户详情
 * - POST /admin/users/{userId}/freeze    冻结用户
 * - POST /admin/users/{userId}/activate  激活用户
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/admin/users")
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private final UserManageService userManageService;

    /**
     * 获取用户列表
     */
    @GetMapping
    public ApiResponse<UserListResponse> getUserList(UserListRequest request) {
        return ApiResponse.success(userManageService.getUserList(request));
    }

    /**
     * 获取用户详情
     */
    @GetMapping("/{userId}")
    public ApiResponse<UserDetailResponse> getUserDetail(@PathVariable String userId) {
        return ApiResponse.success(userManageService.getUserDetail(userId));
    }

    /**
     * 冻结用户
     */
    @PostMapping("/{userId}/freeze")
    public ApiResponse<Void> freezeUser(
            @PathVariable String userId,
            Authentication authentication) {
        String operatorId = authentication.getName();
        userManageService.freezeUser(userId, operatorId);
        return ApiResponse.success();
    }

    /**
     * 激活用户
     */
    @PostMapping("/{userId}/activate")
    public ApiResponse<Void> activateUser(
            @PathVariable String userId,
            Authentication authentication) {
        String operatorId = authentication.getName();
        userManageService.activateUser(userId, operatorId);
        return ApiResponse.success();
    }
}
