package com.smartmall.infrastructure.repository;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.smartmall.domain.entity.User;
import com.smartmall.domain.repository.UserRepository;
import com.smartmall.infrastructure.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

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
}
