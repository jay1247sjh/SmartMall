package com.smartmall.domain.enums;

/**
 * 区域状态
 */
public enum AreaStatus {
    LOCKED,      // 锁定，不可编辑
    PENDING,     // 申请中
    AUTHORIZED,  // 已授权
    OCCUPIED     // 已占用
}
