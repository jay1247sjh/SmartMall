package com.smartmall.application.service;

import com.smartmall.common.exception.BusinessException;
import com.smartmall.common.response.ResultCode;
import com.smartmall.domain.entity.User;
import com.smartmall.domain.repository.UserRepository;
import com.smartmall.infrastructure.security.JwtTokenProvider;
import com.smartmall.interfaces.dto.auth.LoginRequest;
import com.smartmall.interfaces.dto.auth.RefreshTokenRequest;
import com.smartmall.interfaces.dto.auth.TokenResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

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
    public TokenResponse login(LoginRequest request) {
        // 查找用户
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new BusinessException(ResultCode.USER_NOT_FOUND));

        // 验证密码
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BusinessException(ResultCode.PASSWORD_ERROR);
        }

        // 检查用户状态
        if (user.getStatus() != com.smartmall.domain.enums.UserStatus.ACTIVE) {
            throw new BusinessException(ResultCode.USER_FROZEN);
        }

        // 更新最后登录时间
        user.setLastLoginTime(LocalDateTime.now());
        userRepository.updateById(user);

        // 生成 Token
        String accessToken = jwtTokenProvider.generateAccessToken(
                user.getUserId(),
                user.getUsername(),
                user.getUserType().name()
        );
        String refreshToken = jwtTokenProvider.generateRefreshToken(user.getUserId());

        return TokenResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(900L) // 15分钟
                .build();
    }

    /**
     * 刷新 Token
     */
    public TokenResponse refreshToken(RefreshTokenRequest request) {
        String refreshToken = request.getRefreshToken();

        // 验证 RefreshToken
        if (!jwtTokenProvider.validateToken(refreshToken)) {
            throw new BusinessException(ResultCode.AUTH_REFRESH_TOKEN_EXPIRED);
        }

        if (!jwtTokenProvider.isRefreshToken(refreshToken)) {
            throw new BusinessException(ResultCode.AUTH_TOKEN_INVALID);
        }

        // 获取用户信息
        String userId = jwtTokenProvider.getUserIdFromToken(refreshToken);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ResultCode.USER_NOT_FOUND));

        // 生成新的 AccessToken
        String newAccessToken = jwtTokenProvider.generateAccessToken(
                user.getUserId(),
                user.getUsername(),
                user.getUserType().name()
        );

        return TokenResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(900L)
                .build();
    }
}
