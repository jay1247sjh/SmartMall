package com.smartmall.domain.repository;

import com.smartmall.domain.entity.User;
import java.util.Optional;

/**
 * 用户仓储接口
 */
public interface UserRepository {
    
    /**
     * 根据ID查找用户
     */
    Optional<User> findById(String userId);
    
    /**
     * 根据用户名查找用户
     */
    Optional<User> findByUsername(String username);
    
    /**
     * 保存用户
     */
    void save(User user);
    
    /**
     * 更新用户
     */
    void updateById(User user);
    
    /**
     * 检查用户名是否存在
     */
    boolean existsByUsername(String username);
}
