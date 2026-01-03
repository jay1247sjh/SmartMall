package com.smartmall.infrastructure.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * 控制台邮件服务（开发环境使用）
 * 将邮件内容输出到控制台，方便开发调试
 */
@Slf4j
@Service
public class ConsoleEmailService implements EmailService {

    @Override
    public void sendPasswordResetEmail(String to, String resetLink) {
        log.info("========================================");
        log.info("📧 Password Reset Email");
        log.info("========================================");
        log.info("To: {}", to);
        log.info("Subject: Smart Mall - 密码重置");
        log.info("----------------------------------------");
        log.info("您好，");
        log.info("");
        log.info("您正在重置 Smart Mall 账户的密码。");
        log.info("请点击以下链接完成密码重置：");
        log.info("");
        log.info("🔗 {}", resetLink);
        log.info("");
        log.info("此链接将在 30 分钟后失效。");
        log.info("如果您没有请求重置密码，请忽略此邮件。");
        log.info("");
        log.info("Smart Mall 团队");
        log.info("========================================");
    }
}
