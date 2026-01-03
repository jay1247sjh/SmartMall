package com.smartmall.domain.repository;

import com.smartmall.domain.entity.User;
import java.util.Optional;

/**
 * 用户仓储接口
 */
public interface UserRepository {
    
    /**
     * 根据用户名查找用户
     */
    Optional<User> findByUsername(String username);
    
    /**
     * 根据用户ID查找用户
     */
    Optional<User> findById(String userId);
    
    /**
     * 根据邮箱查找用户
     */
    Optional<User> findByEmail(String email);
    
    /**
     * 保存用户
     */
    User save(User user);
    
    /**
     * 更新用户最后登录时间
     */
    void updateLastLoginTime(String userId);
    
    /**
     * 更新用户密码
     */
    void updatePassword(String userId, String passwordHash);
}
