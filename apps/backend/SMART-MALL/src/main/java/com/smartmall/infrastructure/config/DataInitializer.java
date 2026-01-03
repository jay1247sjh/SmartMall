package com.smartmall.infrastructure.config;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.smartmall.domain.entity.User;
import com.smartmall.domain.enums.UserStatus;
import com.smartmall.domain.enums.UserType;
import com.smartmall.infrastructure.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * 数据初始化器
 * 在应用启动时检查并修复测试用户的密码
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        log.info("Checking and initializing test user passwords...");
        
        String correctPasswordHash = passwordEncoder.encode("123456");
        
        // 更新 admin 用户密码
        updateUserPassword("admin", correctPasswordHash, UserType.ADMIN);
        updateUserPassword("merchant", correctPasswordHash, UserType.MERCHANT);
        updateUserPassword("user", correctPasswordHash, UserType.USER);
        
        log.info("Test user passwords initialized successfully");
    }

    private void updateUserPassword(String username, String passwordHash, UserType userType) {
        LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(User::getUsername, username);
        User user = userMapper.selectOne(wrapper);
        
        if (user != null) {
            // 检查密码是否需要更新（如果当前密码无法验证 "123456"）
            if (!passwordEncoder.matches("123456", user.getPasswordHash())) {
                user.setPasswordHash(passwordHash);
                userMapper.updateById(user);
                log.info("Updated password for user: {}", username);
            } else {
                log.info("Password for user {} is already correct", username);
            }
        } else {
            log.warn("User {} not found, skipping password update", username);
        }
    }
}
