package com.smartmall.interfaces.dto.auth;

import com.smartmall.domain.enums.UserStatus;
import com.smartmall.domain.enums.UserType;
import lombok.Builder;
import lombok.Data;

/**
 * 用户注册响应
 */
@Data
@Builder
public class RegisterResponse {
    
    private String userId;
    private String username;
    private String email;
    private UserType userType;
    private UserStatus status;
}
