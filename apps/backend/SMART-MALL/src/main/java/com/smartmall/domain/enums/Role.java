package com.smartmall.domain.enums;

/**
 * 角色枚举
 * 
 * 与共享类型包保持一致
 * @see packages/shared-types/src/enums/user.ts
 */
public enum Role {
    ROLE_ADMIN("ADMIN"),       // 平台管理员
    ROLE_MERCHANT("MERCHANT"), // 商家
    ROLE_USER("USER");         // 普通用户
    
    private final String value;
    
    Role(String value) {
        this.value = value;
    }
    
    public String getValue() {
        return value;
    }
}
