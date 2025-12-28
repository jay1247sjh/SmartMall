package com.smartmall.domain.valueobject;

/**
 * 商城ID值对象
 */
public record MallId(String value) {
    public MallId {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("MallId cannot be null or blank");
        }
    }
}
