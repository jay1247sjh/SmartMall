package com.smartmall.domain.entity;

import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.smartmall.domain.enums.UserStatus;
import com.smartmall.domain.enums.UserType;
import lombok.Data;
import lombok.EqualsAndHashCode;
import java.time.LocalDateTime;

/**
 * 用户实体
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("\"user\"")
public class User extends BaseEntity {
    
    @TableId
    private String userId;
    
    private String username;
    
    private String passwordHash;
    
    private UserType userType;
    
    private UserStatus status;
    
    private String email;
    
    private String phone;
    
    private LocalDateTime lastLoginTime;
}
