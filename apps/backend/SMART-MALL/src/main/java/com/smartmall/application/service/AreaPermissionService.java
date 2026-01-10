package com.smartmall.application.service;

import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.smartmall.common.exception.BusinessException;
import com.smartmall.common.response.ResultCode;
import com.smartmall.domain.entity.Area;
import com.smartmall.domain.entity.AreaPermission;
import com.smartmall.domain.entity.Floor;
import com.smartmall.domain.enums.AreaStatus;
import com.smartmall.domain.enums.PermissionStatus;
import com.smartmall.infrastructure.mapper.AreaMapper;
import com.smartmall.infrastructure.mapper.AreaPermissionMapper;
import com.smartmall.infrastructure.mapper.FloorMapper;
import com.smartmall.interfaces.dto.permission.AreaPermissionDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 区域权限服务
 */
@Service
@RequiredArgsConstructor
public class AreaPermissionService {
    
    private final AreaPermissionMapper areaPermissionMapper;
    private final AreaMapper areaMapper;
    private final FloorMapper floorMapper;
    
    /**
     * 查询商家的权限列表
     */
    public List<AreaPermissionDTO> getMerchantPermissions(String merchantId) {
        List<AreaPermission> permissions = areaPermissionMapper.selectActiveByMerchantId(merchantId);
        
        if (permissions.isEmpty()) {
            return List.of();
        }
        
        // 批量获取区域信息
        List<String> areaIds = permissions.stream()
            .map(AreaPermission::getAreaId)
            .distinct()
            .collect(Collectors.toList());
        Map<String, Area> areaMap = areaMapper.selectBatchIds(areaIds).stream()
            .collect(Collectors.toMap(Area::getAreaId, a -> a));
        
        // 批量获取楼层信息
        List<String> floorIds = areaMap.values().stream()
            .map(Area::getFloorId)
            .distinct()
            .collect(Collectors.toList());
        Map<String, Floor> floorMap = floorIds.isEmpty() ? Map.of() :
            floorMapper.selectBatchIds(floorIds).stream()
                .collect(Collectors.toMap(Floor::getFloorId, f -> f));
        
        return permissions.stream().map(permission -> {
            AreaPermissionDTO dto = new AreaPermissionDTO();
            dto.setPermissionId(permission.getPermissionId());
            dto.setAreaId(permission.getAreaId());
            dto.setStatus(permission.getStatus().name());
            dto.setGrantedAt(permission.getGrantedAt());
            
            Area area = areaMap.get(permission.getAreaId());
            if (area != null) {
                dto.setAreaName(area.getName());
                dto.setFloorId(area.getFloorId());
                dto.setAreaBoundaries(area.getShape());
                
                Floor floor = floorMap.get(area.getFloorId());
                if (floor != null) {
                    dto.setFloorName(floor.getName());
                }
            }
            return dto;
        }).collect(Collectors.toList());
    }
    
    /**
     * 撤销权限
     */
    @Transactional
    public void revokePermission(String permissionId, String adminId, String reason) {
        AreaPermission permission = areaPermissionMapper.selectById(permissionId);
        if (permission == null || permission.getIsDeleted()) {
            throw new BusinessException(ResultCode.PERMISSION_NOT_FOUND);
        }
        
        if (permission.getStatus() != PermissionStatus.ACTIVE) {
            throw new BusinessException(ResultCode.PERMISSION_ALREADY_REVOKED);
        }
        
        // 更新权限状态
        permission.setStatus(PermissionStatus.REVOKED);
        permission.setRevokedAt(LocalDateTime.now());
        permission.setRevokedBy(adminId);
        permission.setRevokeReason(reason);
        areaPermissionMapper.updateById(permission);
        
        // 更新区域状态为可用
        LambdaUpdateWrapper<Area> updateWrapper = new LambdaUpdateWrapper<>();
        updateWrapper.eq(Area::getAreaId, permission.getAreaId())
            .set(Area::getStatus, AreaStatus.AVAILABLE)
            .set(Area::getMerchantId, null);
        areaMapper.update(null, updateWrapper);
    }
    
    /**
     * 检查商家是否有区域的权限
     */
    public boolean hasPermission(String merchantId, String areaId) {
        return areaPermissionMapper.countActiveByAreaAndMerchant(areaId, merchantId) > 0;
    }
}
