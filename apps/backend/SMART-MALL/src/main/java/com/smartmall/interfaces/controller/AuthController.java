package com.smartmall.interfaces.controller;

import com.smartmall.application.service.AuthService;
import com.smartmall.application.service.PasswordService;
import com.smartmall.application.service.RegisterService;
import com.smartmall.common.response.ApiResponse;
import com.smartmall.interfaces.dto.auth.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

/**
 * 认证接口
 */
@Tag(name = "认证管理", description = "注册、登录、登出、刷新Token、密码管理")
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {
    
    private final AuthService authService;
    private final PasswordService passwordService;
    private final RegisterService registerService;
    
    @Operation(summary = "用户注册")
    @PostMapping("/register")
    public ApiResponse<RegisterResponse> register(@Valid @RequestBody RegisterRequest request) {
        RegisterResponse response = registerService.register(request);
        return ApiResponse.success(response);
    }
    
    @Operation(summary = "检查用户名是否可用")
    @GetMapping("/check-username")
    public ApiResponse<Boolean> checkUsername(@RequestParam String username) {
        boolean available = registerService.isUsernameAvailable(username);
        return ApiResponse.success(available);
    }
    
    @Operation(summary = "检查邮箱是否可用")
    @GetMapping("/check-email")
    public ApiResponse<Boolean> checkEmail(@RequestParam String email) {
        boolean available = registerService.isEmailAvailable(email);
        return ApiResponse.success(available);
    }
    
    @Operation(summary = "用户登录")
    @PostMapping("/login")
    public ApiResponse<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request);
        return ApiResponse.success(response);
    }
    
    @Operation(summary = "刷新Token")
    @PostMapping("/refresh")
    public ApiResponse<LoginResponse> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        LoginResponse response = authService.refreshToken(request.getRefreshToken());
        return ApiResponse.success(response);
    }
    
    @Operation(summary = "登出")
    @PostMapping("/logout")
    public ApiResponse<Void> logout() {
        // JWT 无状态，客户端删除 Token 即可
        // 如需服务端失效，可将 Token 加入黑名单（Redis）
        return ApiResponse.success();
    }
    
    @Operation(summary = "忘记密码", description = "发送密码重置链接到邮箱")
    @PostMapping("/forgot-password")
    public ApiResponse<Void> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        passwordService.sendResetLink(request.getEmail());
        return ApiResponse.success();
    }
    
    @Operation(summary = "验证重置令牌", description = "验证密码重置令牌是否有效")
    @PostMapping("/verify-reset-token")
    public ApiResponse<Boolean> verifyResetToken(@Valid @RequestBody VerifyTokenRequest request) {
        boolean valid = passwordService.verifyResetToken(request.getToken());
        return ApiResponse.success(valid);
    }
    
    @Operation(summary = "重置密码", description = "使用重置令牌设置新密码")
    @PostMapping("/reset-password")
    public ApiResponse<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        passwordService.resetPassword(request.getToken(), request.getNewPassword());
        return ApiResponse.success();
    }
    
    @Operation(summary = "修改密码", description = "已登录用户修改密码")
    @PostMapping("/change-password")
    public ApiResponse<Void> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userId = authentication.getName();
        passwordService.changePassword(userId, request.getOldPassword(), request.getNewPassword());
        return ApiResponse.success();
    }
}
