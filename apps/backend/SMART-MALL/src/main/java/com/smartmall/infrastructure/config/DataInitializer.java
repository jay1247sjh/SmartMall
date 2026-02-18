package com.smartmall.infrastructure.config;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.smartmall.domain.entity.Notice;
import com.smartmall.domain.entity.User;
import com.smartmall.domain.enums.UserStatus;
import com.smartmall.domain.enums.UserType;
import com.smartmall.infrastructure.mapper.NoticeMapper;
import com.smartmall.infrastructure.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

/**
 * 数据初始化器
 * 在应用启动时检查并修复测试用户的密码
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserMapper userMapper;
    private final NoticeMapper noticeMapper;
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
        
        initNotices();
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

    private void initNotices() {
        Long count = noticeMapper.selectCount(new LambdaQueryWrapper<>());
        if (count != null && count > 0) {
            log.info("Notices already exist (count={}), skipping initialization", count);
            return;
        }

        log.info("Initializing seed notices...");

        Notice notice1 = new Notice();
        notice1.setNoticeId("n001");
        notice1.setTitle("系统维护通知");
        notice1.setContent("系统将于 2024-12-30 02:00-04:00 进行维护升级，届时部分功能可能暂时不可用，请提前做好准备。");
        notice1.setPublishedAt(LocalDateTime.of(2024, 12, 28, 10, 0));
        notice1.setIsActive(true);
        noticeMapper.insert(notice1);

        Notice notice2 = new Notice();
        notice2.setNoticeId("n002");
        notice2.setTitle("新功能上线：智能导购助手");
        notice2.setContent("Smart Mall 智能导购助手已正式上线，支持自然语言查询店铺、商品和导航，欢迎体验！");
        notice2.setPublishedAt(LocalDateTime.of(2024, 12, 25, 14, 30));
        notice2.setIsActive(true);
        noticeMapper.insert(notice2);

        Notice notice3 = new Notice();
        notice3.setNoticeId("n003");
        notice3.setTitle("商家入驻指南更新");
        notice3.setContent("商家入驻流程已优化，新增区域建模权限申请功能，详情请查看帮助中心。");
        notice3.setPublishedAt(LocalDateTime.of(2024, 12, 20, 9, 0));
        notice3.setIsActive(true);
        noticeMapper.insert(notice3);

        log.info("Seed notices initialized successfully");
    }
}
