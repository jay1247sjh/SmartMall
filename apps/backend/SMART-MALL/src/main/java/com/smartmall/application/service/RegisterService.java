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
import org.springframework.dao.DuplicateKeyException;
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
        
        // 2. 校验密码不能与用户名相同
        if (request.getPassword().equals(request.getUsername())) {
            throw new BusinessException(ResultCode.PARAM_ERROR, "密码不能与用户名相同");
        }
        
        // 3. 校验角色类型（双重保险，DTO 注解已校验）
        UserType type = UserType.valueOf(request.getUserType());
        if (type == UserType.ADMIN) {
            throw new BusinessException(ResultCode.PARAM_ERROR, "不支持的用户类型");
        }
        
        // 4. 输入清洗：去除首尾空白
        String username = request.getUsername().trim();
        String email = request.getEmail().trim();
        String phone = request.getPhone() != null ? request.getPhone().trim() : null;
        
        // 5. 检查用户名是否已存在
        if (userRepository.findByUsername(username).isPresent()) {
            throw new BusinessException(ResultCode.USER_ALREADY_EXISTS, "用户名已被注册");
        }
        
        // 6. 检查邮箱是否已存在
        if (userRepository.findByEmail(email).isPresent()) {
            throw new BusinessException(ResultCode.USER_ALREADY_EXISTS, "邮箱已被注册");
        }
        
        // 7. 创建用户实体
        User user = new User();
        user.setUserId(UUID.randomUUID().toString().replace("-", ""));
        user.setUsername(username);
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setEmail(email);
        user.setPhone(phone);
        user.setUserType(type);
        user.setStatus(UserStatus.ACTIVE);
        
        // 8. 保存用户（捕获并发场景下的唯一约束冲突）
        User savedUser;
        try {
            savedUser = userRepository.save(user);
        } catch (DuplicateKeyException e) {
            String msg = e.getMessage();
            if (msg != null && msg.contains("username")) {
                throw new BusinessException(ResultCode.USER_ALREADY_EXISTS, "用户名已被注册");
            } else if (msg != null && msg.contains("email")) {
                throw new BusinessException(ResultCode.USER_ALREADY_EXISTS, "邮箱已被注册");
            }
            throw new BusinessException(ResultCode.USER_ALREADY_EXISTS, "用户信息已存在");
        }
        log.info("用户注册成功: username={}, email={}", savedUser.getUsername(), savedUser.getEmail());
        
        // 9. 构建响应
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
