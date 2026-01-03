package com.smartmall.application.service;

import com.smartmall.common.exception.BusinessException;
import com.smartmall.common.response.ResultCode;
import com.smartmall.domain.entity.User;
import com.smartmall.domain.enums.UserStatus;
import com.smartmall.domain.enums.UserType;
import com.smartmall.domain.repository.UserRepository;
import com.smartmall.interfaces.dto.auth.RegisterRequest;
import com.smartmall.interfaces.dto.auth.RegisterResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * 用户注册服务
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RegisterService {
    
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    
    /**
     * 用户注册
     */
    @Transactional
    public RegisterResponse register(RegisterRequest request) {
        // 1. 验证两次密码是否一致
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new BusinessException(ResultCode.PARAM_ERROR, "两次输入的密码不一致");
        }
        
        // 2. 检查用户名是否已存在
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new BusinessException(ResultCode.USER_ALREADY_EXISTS, "用户名已被注册");
        }
        
        // 3. 检查邮箱是否已存在
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new BusinessException(ResultCode.USER_ALREADY_EXISTS, "邮箱已被注册");
        }
        
        // 4. 创建用户实体
        User user = new User();
        user.setUserId(UUID.randomUUID().toString().replace("-", ""));
        user.setUsername(request.getUsername());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setEmail(request.getEmail());
        user.setPhone(request.getPhone());
        user.setUserType(UserType.USER);  // 默认为普通用户
        user.setStatus(UserStatus.ACTIVE);
        
        // 5. 保存用户
        User savedUser = userRepository.save(user);
        log.info("用户注册成功: username={}, email={}", savedUser.getUsername(), savedUser.getEmail());
        
        // 6. 构建响应
        return RegisterResponse.builder()
                .userId(savedUser.getUserId())
                .username(savedUser.getUsername())
                .email(savedUser.getEmail())
                .userType(savedUser.getUserType())
                .status(savedUser.getStatus())
                .build();
    }
    
    /**
     * 检查用户名是否可用
     */
    public boolean isUsernameAvailable(String username) {
        return userRepository.findByUsername(username).isEmpty();
    }
    
    /**
     * 检查邮箱是否可用
     */
    public boolean isEmailAvailable(String email) {
        return userRepository.findByEmail(email).isEmpty();
    }
}
