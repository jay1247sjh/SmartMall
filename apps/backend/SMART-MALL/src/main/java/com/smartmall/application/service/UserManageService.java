package com.smartmall.application.service;

import com.smartmall.common.exception.BusinessException;
import com.smartmall.common.response.ResultCode;
import com.smartmall.domain.entity.User;
import com.smartmall.domain.enums.UserStatus;
import com.smartmall.domain.enums.UserType;
import com.smartmall.domain.repository.UserRepository;
import com.smartmall.interfaces.dto.user.UserDetailResponse;
import com.smartmall.interfaces.dto.user.UserListRequest;
import com.smartmall.interfaces.dto.user.UserListResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;

/**
 * 用户管理服务（管理员专用）
 *
 * 业务规则：
 * - 管理员可查看所有用户
 * - 管理员可冻结/激活商家和普通用户
 * - 管理员不可冻结/激活其他管理员
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UserManageService {

    private final UserRepository userRepository;

    /**
     * 查询用户列表（分页）
     */
    public UserListResponse getUserList(UserListRequest request) {
        UserType userType = parseUserType(request.getUserType());
        UserStatus status = parseUserStatus(request.getStatus());
        String keyword = StringUtils.hasText(request.getKeyword()) ? request.getKeyword().trim() : null;
        int page = request.getPage() != null ? request.getPage() : 1;
        int pageSize = request.getPageSize() != null ? request.getPageSize() : 10;

        List<User> users = userRepository.findByCondition(keyword, userType, status, page, pageSize);
        long total = userRepository.countByCondition(keyword, userType, status);

        List<UserDetailResponse> list = users.stream()
                .map(this::toDetailResponse)
                .toList();

        return UserListResponse.builder()
                .list(list)
                .total(total)
                .build();
    }

    /**
     * 查询用户详情
     */
    public UserDetailResponse getUserDetail(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ResultCode.USER_NOT_FOUND));
        return toDetailResponse(user);
    }

    /**
     * 冻结用户
     */
    @Transactional
    public void freezeUser(String targetUserId, String operatorId) {
        User target = userRepository.findById(targetUserId)
                .orElseThrow(() -> new BusinessException(ResultCode.USER_NOT_FOUND));

        // 核心业务规则：禁止冻结管理员
        if (target.getUserType() == UserType.ADMIN) {
            throw new BusinessException(ResultCode.USER_ADMIN_PROTECTED);
        }

        if (target.getStatus() == UserStatus.FROZEN) {
            throw new BusinessException(ResultCode.USER_FROZEN, "该用户已处于冻结状态");
        }

        userRepository.updateStatus(targetUserId, UserStatus.FROZEN);
        log.info("[用户冻结] operator={}, target={}, username={}",
                operatorId, targetUserId, target.getUsername());
    }

    /**
     * 激活用户
     */
    @Transactional
    public void activateUser(String targetUserId, String operatorId) {
        User target = userRepository.findById(targetUserId)
                .orElseThrow(() -> new BusinessException(ResultCode.USER_NOT_FOUND));

        // 核心业务规则：禁止操作管理员
        if (target.getUserType() == UserType.ADMIN) {
            throw new BusinessException(ResultCode.USER_ADMIN_PROTECTED);
        }

        if (target.getStatus() == UserStatus.ACTIVE) {
            throw new BusinessException(ResultCode.PARAM_INVALID, "该用户已处于激活状态");
        }

        userRepository.updateStatus(targetUserId, UserStatus.ACTIVE);
        log.info("[用户激活] operator={}, target={}, username={}",
                operatorId, targetUserId, target.getUsername());
    }

    // ========================================================================
    // 私有方法
    // ========================================================================

    private UserDetailResponse toDetailResponse(User user) {
        return UserDetailResponse.builder()
                .userId(user.getUserId())
                .username(user.getUsername())
                .email(user.getEmail())
                .phone(user.getPhone())
                .userType(user.getUserType())
                .status(user.getStatus())
                .createdAt(user.getCreateTime())
                .lastLoginTime(user.getLastLoginTime())
                .build();
    }

    private UserType parseUserType(String value) {
        if (!StringUtils.hasText(value) || "ALL".equalsIgnoreCase(value)) {
            return null;
        }
        try {
            return UserType.valueOf(value.toUpperCase());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private UserStatus parseUserStatus(String value) {
        if (!StringUtils.hasText(value) || "ALL".equalsIgnoreCase(value)) {
            return null;
        }
        try {
            return UserStatus.valueOf(value.toUpperCase());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
