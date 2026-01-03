package com.smartmall.interfaces.dto.auth;

import com.smartmall.domain.enums.UserStatus;
import com.smartmall.domain.enums.UserType;
import lombok.Builder;
import lombok.Data;

/**
 * 登录响应
 */
@Data
@Builder
public class LoginResponse {
    
    private String accessToken;
    private String refreshToken;
    private UserInfo user;
    
    @Data
    @Builder
    public static class UserInfo {
        private String userId;
        private String username;
        private UserType userType;
        private UserStatus status;
        private String email;
        private String phone;
    }
}
