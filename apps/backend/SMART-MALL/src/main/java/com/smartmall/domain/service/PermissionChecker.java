package com.smartmall.domain.service;

/**
 * 权限校验器接口
 * 用于校验商家对区域的操作权限
 */
public interface PermissionChecker {
    
    /**
     * 校验商家对区域的权限
     * 
     * @param merchantId 商家ID
     * @param areaId 区域ID
     * @return 权限校验结果
     */
    PermissionResult checkAreaPermission(String merchantId, String areaId);
    
    /**
     * 校验商家是否有权限操作指定区域
     * 
     * @param merchantId 商家ID
     * @param areaId 区域ID
     * @return true 如果有权限
     */
    boolean hasPermission(String merchantId, String areaId);
    
    /**
     * 权限校验结果
     */
    record PermissionResult(
        boolean allowed,
        String errorCode,
        String errorMessage
    ) {
        public static PermissionResult success() {
            return new PermissionResult(true, null, null);
        }
        
        public static PermissionResult denied(String errorCode, String errorMessage) {
            return new PermissionResult(false, errorCode, errorMessage);
        }
    }
}
