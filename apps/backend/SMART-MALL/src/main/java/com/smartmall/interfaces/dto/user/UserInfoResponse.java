package com.smartmall.interfaces.dto.user;

import com.smartmall.domain.enums.UserStatus;
import com.smartmall.domain.enums.UserType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 用户信息响应
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserInfoResponse {
    
    private String userId;
    private String username;
    private UserType userType;
    private UserStatus status;
    private String email;
    private String phone;
    private LocalDateTime lastLoginTime;
}
