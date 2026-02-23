package com.smartmall.interfaces.dto.user;

import com.smartmall.domain.enums.UserStatus;
import com.smartmall.domain.enums.UserType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 用户详情响应（管理员视角）
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDetailResponse {
    
    private String userId;
    private String username;
    private String email;
    private String phone;
    private UserType userType;
    private UserStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime lastLoginTime;
}
