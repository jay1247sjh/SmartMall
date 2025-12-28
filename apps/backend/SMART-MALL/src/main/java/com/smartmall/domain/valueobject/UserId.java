package com.smartmall.domain.valueobject;

/**
 * 用户ID值对象
 */
public record UserId(String value) {
    public UserId {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("UserId cannot be null or blank");
        }
    }
}
