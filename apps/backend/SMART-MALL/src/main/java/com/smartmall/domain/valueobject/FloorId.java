package com.smartmall.domain.valueobject;

/**
 * 楼层ID值对象
 */
public record FloorId(String value) {
    public FloorId {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("FloorId cannot be null or blank");
        }
    }
}
