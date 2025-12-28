package com.smartmall.interfaces.controller;

import com.smartmall.application.service.AuthService;
import com.smartmall.common.response.ApiResponse;
import com.smartmall.interfaces.dto.auth.LoginRequest;
import com.smartmall.interfaces.dto.auth.RefreshTokenRequest;
import com.smartmall.interfaces.dto.auth.TokenResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * 认证控制器
 */
@Tag(name = "认证管理", description = "用户登录、Token刷新等")
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @Operation(summary = "用户登录")
    @PostMapping("/login")
    public ApiResponse<TokenResponse> login(@Valid @RequestBody LoginRequest request) {
        TokenResponse response = authService.login(request);
        return ApiResponse.success(response);
    }

    @Operation(summary = "刷新Token")
    @PostMapping("/refresh")
    public ApiResponse<TokenResponse> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        TokenResponse response = authService.refreshToken(request);
        return ApiResponse.success(response);
    }

    @Operation(summary = "用户登出")
    @PostMapping("/logout")
    public ApiResponse<Void> logout() {
        // JWT 无状态，客户端删除 Token 即可
        return ApiResponse.success();
    }
}
