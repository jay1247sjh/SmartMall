package com.smartmall.application.service;

import com.smartmall.common.exception.BusinessException;
import com.smartmall.common.response.ResultCode;
import com.smartmall.domain.entity.User;
import com.smartmall.domain.repository.UserRepository;
import com.smartmall.interfaces.dto.user.UpdateProfileRequest;
import com.smartmall.interfaces.dto.user.UserInfoResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.Optional;

/**
 * 用户资料服务
 */
@Service
@RequiredArgsConstructor
public class UserProfileService {

    private final UserRepository userRepository;

    /**
     * 获取当前用户资料
     */
    public UserInfoResponse getProfile(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ResultCode.USER_NOT_FOUND));
        return toResponse(user);
    }

    /**
     * 更新当前用户资料（邮箱、手机号）
     */
    @Transactional
    public UserInfoResponse updateProfile(String userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ResultCode.USER_NOT_FOUND));

        String email = normalizeNullable(request.getEmail());
        String phone = normalizeNullable(request.getPhone());

        if (email != null) {
            Optional<User> existing = userRepository.findByEmail(email);
            if (existing.isPresent() && !existing.get().getUserId().equals(userId)) {
                throw new BusinessException(ResultCode.USER_ALREADY_EXISTS, "邮箱已被占用");
            }
            user.setEmail(email);
        } else if (request.getEmail() != null) {
            user.setEmail(null);
        }

        if (phone != null) {
            user.setPhone(phone);
        } else if (request.getPhone() != null) {
            user.setPhone(null);
        }

        userRepository.save(user);
        return toResponse(user);
    }

    private String normalizeNullable(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        return value.trim();
    }

    private UserInfoResponse toResponse(User user) {
        UserInfoResponse response = new UserInfoResponse();
        response.setUserId(user.getUserId());
        response.setUsername(user.getUsername());
        response.setUserType(user.getUserType());
        response.setStatus(user.getStatus());
        response.setEmail(user.getEmail());
        response.setPhone(user.getPhone());
        response.setLastLoginTime(user.getLastLoginTime());
        return response;
    }
}
