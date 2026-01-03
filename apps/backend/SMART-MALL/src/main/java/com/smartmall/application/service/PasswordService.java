package com.smartmall.application.service;

import com.smartmall.common.exception.BusinessException;
import com.smartmall.common.response.ResultCode;
import com.smartmall.domain.entity.User;
import com.smartmall.domain.repository.UserRepository;
import com.smartmall.infrastructure.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

/**
 * 密码管理服务
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PasswordService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final StringRedisTemplate redisTemplate;
    private final EmailService emailService;

    @Value("${app.password-reset.token-expiration:30}")
    private int tokenExpirationMinutes;

    @Value("${app.password-reset.rate-limit:5}")
    private int rateLimitMinutes;

    @Value("${app.password-reset.base-url:http://localhost:5173}")
    private String baseUrl;

    private static final String RESET_TOKEN_PREFIX = "password:reset:";
    private static final String RATE_LIMIT_PREFIX = "password:rate:";
    private static final int MIN_PASSWORD_LENGTH = 6;

    /**
     * 发送密码重置链接
     * 无论邮箱是否存在，都返回成功（防止邮箱枚举攻击）
     */
    public void sendResetLink(String email) {
        // 检查频率限制
        String rateLimitKey = RATE_LIMIT_PREFIX + email;
        if (Boolean.TRUE.equals(redisTemplate.hasKey(rateLimitKey))) {
            throw new BusinessException(ResultCode.PASSWORD_RESET_RATE_LIMITED);
        }

        // 查找用户
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            // 邮箱不存在，但仍然设置频率限制并返回成功（防止枚举）
            redisTemplate.opsForValue().set(rateLimitKey, "1", rateLimitMinutes, TimeUnit.MINUTES);
            log.info("Password reset requested for non-existent email: {}", email);
            return;
        }

        User user = userOpt.get();

        // 生成重置令牌
        String token = UUID.randomUUID().toString().replace("-", "");
        String tokenKey = RESET_TOKEN_PREFIX + token;

        // 存储令牌到 Redis
        redisTemplate.opsForValue().set(tokenKey, user.getUserId(), tokenExpirationMinutes, TimeUnit.MINUTES);

        // 设置频率限制
        redisTemplate.opsForValue().set(rateLimitKey, "1", rateLimitMinutes, TimeUnit.MINUTES);

        // 发送邮件
        String resetLink = baseUrl + "/reset-password?token=" + token;
        emailService.sendPasswordResetEmail(email, resetLink);

        log.info("Password reset link sent to: {}", email);
    }

    /**
     * 验证重置令牌
     */
    public boolean verifyResetToken(String token) {
        String tokenKey = RESET_TOKEN_PREFIX + token;
        return Boolean.TRUE.equals(redisTemplate.hasKey(tokenKey));
    }

    /**
     * 重置密码
     */
    @Transactional
    public void resetPassword(String token, String newPassword) {
        // 验证密码长度
        validatePasswordLength(newPassword);

        // 验证令牌
        String tokenKey = RESET_TOKEN_PREFIX + token;
        String userId = redisTemplate.opsForValue().get(tokenKey);

        if (userId == null) {
            throw new BusinessException(ResultCode.PASSWORD_RESET_TOKEN_INVALID);
        }

        // 查找用户
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ResultCode.USER_NOT_FOUND));

        // 更新密码
        String encodedPassword = passwordEncoder.encode(newPassword);
        userRepository.updatePassword(userId, encodedPassword);

        // 删除令牌（单次使用）
        redisTemplate.delete(tokenKey);

        log.info("Password reset successful for user: {}", userId);
    }

    /**
     * 修改密码（已登录用户）
     */
    @Transactional
    public void changePassword(String userId, String oldPassword, String newPassword) {
        // 验证密码长度
        validatePasswordLength(newPassword);

        // 查找用户
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ResultCode.USER_NOT_FOUND));

        // 验证旧密码
        if (!passwordEncoder.matches(oldPassword, user.getPasswordHash())) {
            throw new BusinessException(ResultCode.PASSWORD_OLD_INCORRECT);
        }

        // 验证新旧密码不同
        if (passwordEncoder.matches(newPassword, user.getPasswordHash())) {
            throw new BusinessException(ResultCode.PASSWORD_SAME_AS_OLD);
        }

        // 更新密码
        String encodedPassword = passwordEncoder.encode(newPassword);
        userRepository.updatePassword(userId, encodedPassword);

        log.info("Password changed for user: {}", userId);
    }

    /**
     * 验证密码长度
     */
    private void validatePasswordLength(String password) {
        if (password == null || password.length() < MIN_PASSWORD_LENGTH) {
            throw new BusinessException(ResultCode.PASSWORD_TOO_SHORT);
        }
    }
}
