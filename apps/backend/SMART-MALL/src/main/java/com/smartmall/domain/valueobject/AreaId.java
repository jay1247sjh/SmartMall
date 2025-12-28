package com.smartmall.domain.valueobject;

/**
 * 区域ID值对象
 */
public record AreaId(String value) {
    public AreaId {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("AreaId cannot be null or blank");
        }
    }
}
