package com.smartmall.domain.valueobject;

/**
 * 店铺ID值对象
 */
public record StoreId(String value) {
    public StoreId {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("StoreId cannot be null or blank");
        }
    }
}
