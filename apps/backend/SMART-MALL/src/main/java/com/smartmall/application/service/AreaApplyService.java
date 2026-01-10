package com.smartmall.application.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.smartmall.common.exception.BusinessException;
import com.smartmall.common.response.ResultCode;
import com.smartmall.common.util.IdGenerator;
import com.smartmall.domain.entity.Area;
import com.smartmall.domain.entity.AreaApply;
import com.smartmall.domain.entity.AreaPermission;
import com.smartmall.domain.entity.Floor;
import com.smartmall.domain.entity.User;
import com.smartmall.domain.enums.ApplyStatus;
import com.smartmall.domain.enums.AreaStatus;
import com.smartmall.domain.enums.PermissionStatus;
import com.smartmall.infrastructure.mapper.AreaApplyMapper;
import com.smartmall.infrastructure.mapper.AreaMapper;
import com.smartmall.infrastructure.mapper.AreaPermissionMapper;
import com.smartmall.infrastructure.mapper.FloorMapper;
import com.smartmall.infrastructure.mapper.UserMapper;
import com.smartmall.interfaces.dto.permission.AreaApplyDTO;
import com.smartmall.interfaces.dto.permission.AreaApplyRequest;
import com.smartmall.interfaces.dto.permission.AvailableAreaDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 区域权限申请服务
 */
@Service
@RequiredArgsConstructor
public class AreaApplyService {
    
    private final AreaApplyMapper areaApplyMapper;
    private final AreaPermissionMapper areaPermissionMapper;
    private final AreaMapper areaMapper;
    private final FloorMapper floorMapper;
    private final UserMapper userMapper;
    
    /**
     * 获取可申请的区域列表
     */
    public List<AvailableAreaDTO> getAvailableAreas(String floorId) {
        LambdaQueryWrapper<Area> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Area::getIsDeleted, false);
        if (floorId != null && !floorId.isEmpty()) {
            wrapper.eq(Area::getFloorId, floorId);
        }
        // 只返回 AVAILABLE 或 LOCKED 状态的区域
        wrapper.in(Area::getStatus, AreaStatus.AVAILABLE, AreaStatus.LOCKED);
        
        List<Area> areas = areaMapper.selectList(wrapper);
        
        // 获取楼层信息
        List<String> floorIds = areas.stream()
            .map(Area::getFloorId)
            .distinct()
            .collect(Collectors.toList());
        
        Map<String, Floor> floorMap = floorIds.isEmpty() ? Map.of() :
            floorMapper.selectBatchIds(floorIds).stream()
                .collect(Collectors.toMap(Floor::getFloorId, f -> f));
        
        return areas.stream().map(area -> {
            AvailableAreaDTO dto = new AvailableAreaDTO();
            dto.setAreaId(area.getAreaId());
            dto.setName(area.getName());
            dto.setType(area.getType());
            dto.setFloorId(area.getFloorId());
            dto.setStatus(area.getStatus() != null ? area.getStatus().name() : "AVAILABLE");
            dto.setShape(area.getShape());
            dto.setProperties(area.getProperties());
            
            Floor floor = floorMap.get(area.getFloorId());
            if (floor != null) {
                dto.setFloorName(floor.getName());
            }
            return dto;
        }).collect(Collectors.toList());
    }
    
    /**
     * 提交区域权限申请
     */
    @Transactional
    public AreaApplyDTO submitApplication(AreaApplyRequest request, String merchantId) {
        // 检查区域是否存在
        Area area = areaMapper.selectById(request.getAreaId());
        if (area == null || area.getIsDeleted()) {
            throw new BusinessException(ResultCode.AREA_NOT_FOUND);
        }
        
        // 检查区域状态是否可申请
        if (area.getStatus() != null && area.getStatus() != AreaStatus.AVAILABLE) {
            throw new BusinessException(ResultCode.AREA_NOT_AVAILABLE);
        }
        
        // 检查是否已有待审批申请
        int pendingCount = areaApplyMapper.countPendingByAreaAndMerchant(request.getAreaId(), merchantId);
        if (pendingCount > 0) {
            throw new BusinessException(ResultCode.DUPLICATE_APPLICATION);
        }
        
        // 创建申请记录
        AreaApply apply = new AreaApply();
        apply.setApplyId(IdGenerator.nextId());
        apply.setAreaId(request.getAreaId());
        apply.setMerchantId(merchantId);
        apply.setStatus(ApplyStatus.PENDING);
        apply.setApplyReason(request.getApplyReason());
        
        areaApplyMapper.insert(apply);
        
        // 获取楼层信息
        Floor floor = floorMapper.selectById(area.getFloorId());
        
        return convertToDTO(apply, area, floor, null);
    }
    
    /**
     * 查询商家的申请列表
     */
    public List<AreaApplyDTO> getMerchantApplications(String merchantId) {
        List<AreaApply> applies = areaApplyMapper.selectByMerchantId(merchantId);
        return convertToDTOList(applies);
    }
    
    /**
     * 查询待审批申请列表
     */
    public List<AreaApplyDTO> getPendingApplications() {
        List<AreaApply> applies = areaApplyMapper.selectByStatus(ApplyStatus.PENDING.name());
        return convertToDTOList(applies);
    }
    
    /**
     * 审批通过
     */
    @Transactional
    public void approveApplication(String applyId, String adminId) {
        AreaApply apply = areaApplyMapper.selectById(applyId);
        if (apply == null || apply.getIsDeleted()) {
            throw new BusinessException(ResultCode.APPLICATION_NOT_FOUND);
        }
        
        if (apply.getStatus() != ApplyStatus.PENDING) {
            throw new BusinessException(ResultCode.APPLICATION_ALREADY_PROCESSED);
        }
        
        // 更新申请状态
        apply.setStatus(ApplyStatus.APPROVED);
        apply.setApprovedAt(LocalDateTime.now());
        apply.setApprovedBy(adminId);
        areaApplyMapper.updateById(apply);
        
        // 创建权限记录
        AreaPermission permission = new AreaPermission();
        permission.setPermissionId(IdGenerator.nextId());
        permission.setAreaId(apply.getAreaId());
        permission.setMerchantId(apply.getMerchantId());
        permission.setStatus(PermissionStatus.ACTIVE);
        permission.setGrantedAt(LocalDateTime.now());
        areaPermissionMapper.insert(permission);
        
        // 更新区域状态为已占用
        LambdaUpdateWrapper<Area> updateWrapper = new LambdaUpdateWrapper<>();
        updateWrapper.eq(Area::getAreaId, apply.getAreaId())
            .set(Area::getStatus, AreaStatus.OCCUPIED)
            .set(Area::getMerchantId, apply.getMerchantId());
        areaMapper.update(null, updateWrapper);
    }
    
    /**
     * 审批驳回
     */
    @Transactional
    public void rejectApplication(String applyId, String adminId, String reason) {
        AreaApply apply = areaApplyMapper.selectById(applyId);
        if (apply == null || apply.getIsDeleted()) {
            throw new BusinessException(ResultCode.APPLICATION_NOT_FOUND);
        }
        
        if (apply.getStatus() != ApplyStatus.PENDING) {
            throw new BusinessException(ResultCode.APPLICATION_ALREADY_PROCESSED);
        }
        
        // 更新申请状态
        apply.setStatus(ApplyStatus.REJECTED);
        apply.setRejectedAt(LocalDateTime.now());
        apply.setApprovedBy(adminId);
        apply.setRejectReason(reason);
        areaApplyMapper.updateById(apply);
    }
    
    private List<AreaApplyDTO> convertToDTOList(List<AreaApply> applies) {
        if (applies.isEmpty()) {
            return List.of();
        }
        
        // 批量获取区域信息
        List<String> areaIds = applies.stream()
            .map(AreaApply::getAreaId)
            .distinct()
            .collect(Collectors.toList());
        Map<String, Area> areaMap = areaMapper.selectBatchIds(areaIds).stream()
            .collect(Collectors.toMap(Area::getAreaId, a -> a));
        
        // 批量获取楼层信息
        List<String> floorIds = areaMap.values().stream()
            .map(Area::getFloorId)
            .filter(id -> id != null)
            .distinct()
            .collect(Collectors.toList());
        Map<String, Floor> floorMap = floorIds.isEmpty() ? Map.of() :
            floorMapper.selectBatchIds(floorIds).stream()
                .collect(Collectors.toMap(Floor::getFloorId, f -> f));
        
        // 批量获取商家信息
        List<String> merchantIds = applies.stream()
            .map(AreaApply::getMerchantId)
            .distinct()
            .collect(Collectors.toList());
        Map<String, User> userMap = userMapper.selectBatchIds(merchantIds).stream()
            .collect(Collectors.toMap(User::getUserId, u -> u));
        
        return applies.stream()
            .map(apply -> {
                Area area = areaMap.get(apply.getAreaId());
                Floor floor = area != null ? floorMap.get(area.getFloorId()) : null;
                User merchant = userMap.get(apply.getMerchantId());
                return convertToDTO(apply, area, floor, merchant);
            })
            .collect(Collectors.toList());
    }
    
    private AreaApplyDTO convertToDTO(AreaApply apply, Area area, Floor floor, User merchant) {
        AreaApplyDTO dto = new AreaApplyDTO();
        dto.setApplyId(apply.getApplyId());
        dto.setAreaId(apply.getAreaId());
        dto.setMerchantId(apply.getMerchantId());
        dto.setStatus(apply.getStatus().name());
        dto.setApplyReason(apply.getApplyReason());
        dto.setRejectReason(apply.getRejectReason());
        dto.setCreatedAt(apply.getCreateTime());
        dto.setApprovedAt(apply.getApprovedAt());
        dto.setRejectedAt(apply.getRejectedAt());
        
        if (area != null) {
            dto.setAreaName(area.getName());
        }
        if (floor != null) {
            dto.setFloorName(floor.getName());
        }
        if (merchant != null) {
            dto.setMerchantName(merchant.getUsername());
        }
        return dto;
    }
}
