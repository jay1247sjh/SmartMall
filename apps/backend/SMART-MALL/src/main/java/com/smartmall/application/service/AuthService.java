package com.smartmall.application.service;

import com.smartmall.common.exception.BusinessException;
import com.smartmall.common.response.ResultCode;
import com.smartmall.domain.entity.User;
import com.smartmall.domain.enums.UserStatus;
import com.smartmall.domain.repository.UserRepository;
import com.smartmall.infrastructure.security.JwtTokenProvider;
import com.smartmall.interfaces.dto.auth.LoginRequest;
import com.smartmall.interfaces.dto.auth.LoginResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 认证服务
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {
    
    private final UserRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder;
    
    /**
     * 用户登录
     */
    @Transactional
    public LoginResponse login(LoginRequest request) {
        // 1. 查找用户
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new BusinessException(ResultCode.AUTH_FAILED, "用户名或密码错误"));
        
        // 2. 验证密码
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BusinessException(ResultCode.AUTH_FAILED, "用户名或密码错误");
        }
        
        // 3. 检查用户状态
        if (user.getStatus() == UserStatus.FROZEN) {
            throw new BusinessException(ResultCode.AUTH_FAILED, "账号已被冻结");
        }
        if (user.getStatus() == UserStatus.DELETED) {
            throw new BusinessException(ResultCode.AUTH_FAILED, "账号不存在");
        }
        
        // 4. 生成 Token
        String accessToken = jwtTokenProvider.generateAccessToken(
                user.getUserId(), 
                user.getUsername(), 
                user.getUserType().name()
        );
        String refreshToken = jwtTokenProvider.generateRefreshToken(user.getUserId());
        
        // 5. 更新最后登录时间
        userRepository.updateLastLoginTime(user.getUserId());
        
        // 6. 构建响应
        return LoginResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .user(LoginResponse.UserInfo.builder()
                        .userId(user.getUserId())
                        .username(user.getUsername())
                        .userType(user.getUserType())
                        .status(user.getStatus())
                        .email(user.getEmail())
                        .phone(user.getPhone())
                        .build())
                .build();
    }
    
    /**
     * 刷新 Token
     */
    public LoginResponse refreshToken(String refreshToken) {
        // 1. 验证 RefreshToken
        var validationResult = jwtTokenProvider.validateToken(refreshToken);
        if (!validationResult.isValid()) {
            if (validationResult.isExpired()) {
                throw new BusinessException(ResultCode.TOKEN_EXPIRED, "RefreshToken 已过期");
            }
            throw new BusinessException(ResultCode.AUTH_FAILED, "无效的 RefreshToken");
        }
        
        if (!jwtTokenProvider.isRefreshToken(refreshToken)) {
            throw new BusinessException(ResultCode.AUTH_FAILED, "无效的 RefreshToken");
        }
        
        // 2. 获取用户信息
        String userId = jwtTokenProvider.getUserIdFromToken(refreshToken).orElse(null);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ResultCode.AUTH_FAILED, "用户不存在"));
        
        // 3. 检查用户状态
        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new BusinessException(ResultCode.AUTH_FAILED, "账号状态异常");
        }
        
        // 4. 生成新 Token
        String newAccessToken = jwtTokenProvider.generateAccessToken(
                user.getUserId(),
                user.getUsername(),
                user.getUserType().name()
        );
        String newRefreshToken = jwtTokenProvider.generateRefreshToken(user.getUserId());
        
        // 5. 构建响应
        return LoginResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .user(LoginResponse.UserInfo.builder()
                        .userId(user.getUserId())
                        .username(user.getUsername())
                        .userType(user.getUserType())
                        .status(user.getStatus())
                        .email(user.getEmail())
                        .phone(user.getPhone())
                        .build())
                .build();
    }
}
