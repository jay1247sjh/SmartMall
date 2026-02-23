package com.smartmall.domain.repository;

import com.smartmall.domain.entity.User;
import com.smartmall.domain.enums.UserStatus;
import com.smartmall.domain.enums.UserType;

import java.util.List;
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
    
    /**
     * 分页查询用户列表
     *
     * @param keyword  搜索关键词（用户名或邮箱模糊匹配），可为 null
     * @param userType 用户类型筛选，可为 null 表示全部
     * @param status   用户状态筛选，可为 null 表示全部
     * @param page     页码（从 1 开始）
     * @param pageSize 每页数量
     * @return 用户列表
     */
    List<User> findByCondition(String keyword, UserType userType, UserStatus status, int page, int pageSize);
    
    /**
     * 统计符合条件的用户数量
     */
    long countByCondition(String keyword, UserType userType, UserStatus status);
    
    /**
     * 更新用户状态
     */
    void updateStatus(String userId, UserStatus status);
}
