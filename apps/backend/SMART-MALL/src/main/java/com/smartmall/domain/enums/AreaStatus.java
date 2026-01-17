package com.smartmall.domain.enums;

/**
 * 区域状态
 * 
 * 与共享类型包保持一致
 * @see packages/shared-types/src/enums/area.ts
 */
public enum AreaStatus {
    AVAILABLE("AVAILABLE"),     // 可申请
    LOCKED("LOCKED"),           // 锁定，不可申请
    PENDING("PENDING"),         // 有商家申请中，等待审批
    AUTHORIZED("AUTHORIZED"),   // 已授权，可被特定商家编辑
    OCCUPIED("OCCUPIED");       // 已占用
    
    private final String value;
    
    AreaStatus(String value) {
        this.value = value;
    }
    
    public String getValue() {
        return value;
    }
}
