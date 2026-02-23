package com.smartmall.infrastructure.repository;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.smartmall.domain.entity.User;
import com.smartmall.domain.enums.UserStatus;
import com.smartmall.domain.enums.UserType;
import com.smartmall.domain.repository.UserRepository;
import com.smartmall.infrastructure.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Optional;

/**
 * 用户仓储实现
 */
@Repository
@RequiredArgsConstructor
public class UserRepositoryImpl implements UserRepository {
    
    private final UserMapper userMapper;
    
    @Override
    public Optional<User> findByUsername(String username) {
        LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(User::getUsername, username);
        return Optional.ofNullable(userMapper.selectOne(wrapper));
    }
    
    @Override
    public Optional<User> findById(String userId) {
        return Optional.ofNullable(userMapper.selectById(userId));
    }
    
    @Override
    public Optional<User> findByEmail(String email) {
        LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(User::getEmail, email);
        return Optional.ofNullable(userMapper.selectOne(wrapper));
    }
    
    @Override
    public User save(User user) {
        if (user.getUserId() == null) {
            userMapper.insert(user);
        } else {
            userMapper.updateById(user);
        }
        return user;
    }
    
    @Override
    public void updateLastLoginTime(String userId) {
        userMapper.updateLastLoginTime(userId);
    }
    
    @Override
    public void updatePassword(String userId, String passwordHash) {
        userMapper.updatePassword(userId, passwordHash);
    }
    
    @Override
    public List<User> findByCondition(String keyword, UserType userType, UserStatus status, int page, int pageSize) {
        LambdaQueryWrapper<User> wrapper = buildConditionWrapper(keyword, userType, status);
        wrapper.orderByDesc(User::getCreateTime);
        Page<User> pageObj = new Page<>(page, pageSize);
        return userMapper.selectPage(pageObj, wrapper).getRecords();
    }
    
    @Override
    public long countByCondition(String keyword, UserType userType, UserStatus status) {
        LambdaQueryWrapper<User> wrapper = buildConditionWrapper(keyword, userType, status);
        return userMapper.selectCount(wrapper);
    }
    
    @Override
    public void updateStatus(String userId, UserStatus status) {
        userMapper.updateStatus(userId, status.name());
    }
    
    /**
     * 构建条件查询 Wrapper
     */
    private LambdaQueryWrapper<User> buildConditionWrapper(String keyword, UserType userType, UserStatus status) {
        LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<>();
        if (StringUtils.hasText(keyword)) {
            wrapper.and(w -> w
                    .like(User::getUsername, keyword)
                    .or()
                    .like(User::getEmail, keyword)
            );
        }
        if (userType != null) {
            wrapper.eq(User::getUserType, userType);
        }
        if (status != null) {
            wrapper.eq(User::getStatus, status);
        }
        return wrapper;
    }
}
