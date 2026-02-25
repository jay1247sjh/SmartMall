package com.smartmall.interfaces.controller;

import com.smartmall.application.service.UserProfileService;
import com.smartmall.common.response.ApiResponse;
import com.smartmall.interfaces.dto.user.UpdateProfileRequest;
import com.smartmall.interfaces.dto.user.UserInfoResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 用户资料控制器
 */
@Tag(name = "用户资料", description = "当前登录用户资料查询与更新")
@RestController
@RequestMapping("/user")
@RequiredArgsConstructor
public class UserProfileController {

    private final UserProfileService userProfileService;

    @Operation(summary = "获取当前用户资料")
    @GetMapping("/profile")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<UserInfoResponse> getProfile(Authentication authentication) {
        String userId = authentication.getName();
        return ApiResponse.success(userProfileService.getProfile(userId));
    }

    @Operation(summary = "更新当前用户资料")
    @PutMapping("/profile")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<UserInfoResponse> updateProfile(
            Authentication authentication,
            @Valid @RequestBody UpdateProfileRequest request) {
        String userId = authentication.getName();
        return ApiResponse.success(userProfileService.updateProfile(userId, request));
    }
}
