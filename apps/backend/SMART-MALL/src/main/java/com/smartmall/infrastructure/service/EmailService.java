package com.smartmall.infrastructure.service;

/**
 * 邮件服务接口
 */
public interface EmailService {
    
    /**
     * 发送密码重置邮件
     * @param to 收件人邮箱
     * @param resetLink 重置链接
     */
    void sendPasswordResetEmail(String to, String resetLink);
}
