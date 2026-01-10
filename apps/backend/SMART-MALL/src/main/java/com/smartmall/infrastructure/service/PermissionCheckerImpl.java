package com.smartmall.infrastructure.service;

import com.smartmall.domain.service.PermissionChecker;
import com.smartmall.infrastructure.mapper.AreaPermissionMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * 权限校验器实现
 */
@Service
@RequiredArgsConstructor
public class PermissionCheckerImpl implements PermissionChecker {
    
    private final AreaPermissionMapper areaPermissionMapper;
    
    @Override
    public PermissionResult checkAreaPermission(String merchantId, String areaId) {
        if (merchantId == null || areaId == null) {
            return PermissionResult.denied("INVALID_PARAMS", "商家ID或区域ID不能为空");
        }
        
        int count = areaPermissionMapper.countActiveByAreaAndMerchant(areaId, merchantId);
        
        if (count > 0) {
            return PermissionResult.success();
        } else {
            return PermissionResult.denied("PERMISSION_DENIED", "您没有该区域的操作权限");
        }
    }
    
    @Override
    public boolean hasPermission(String merchantId, String areaId) {
        if (merchantId == null || areaId == null) {
            return false;
        }
        return areaPermissionMapper.countActiveByAreaAndMerchant(areaId, merchantId) > 0;
    }
}
