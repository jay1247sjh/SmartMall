package com.smartmall.domain.enums;

/**
 * 区域状态
 */
public enum AreaStatus {
    AVAILABLE,   // 可申请
    OCCUPIED,    // 已占用（已授权给商家）
    LOCKED       // 锁定，不可申请
}
