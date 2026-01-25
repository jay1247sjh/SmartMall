package com.smartmall.application.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.smartmall.common.exception.BusinessException;
import com.smartmall.common.response.ResultCode;
import com.smartmall.common.util.IdGenerator;
import com.smartmall.common.util.ValidationUtils;
import com.smartmall.domain.entity.Area;
import com.smartmall.domain.entity.Floor;
import com.smartmall.domain.entity.Store;
import com.smartmall.domain.entity.User;
import com.smartmall.domain.enums.StoreStatus;
import com.smartmall.infrastructure.mapper.*;
import com.smartmall.interfaces.dto.store.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 店铺服务
 */
@Service
@RequiredArgsConstructor
public class StoreService {
    
    private final StoreMapper storeMapper;
    private final AreaMapper areaMapper;
    private final FloorMapper floorMapper;
    private final UserMapper userMapper;
    private final AreaPermissionMapper areaPermissionMapper;
    
    /**
     * 创建店铺
     */
    @Transactional
    public StoreDTO createStore(String merchantId, CreateStoreRequest request) {
        // 检查商家是否有该区域的权限
        int permissionCount = areaPermissionMapper.countActiveByAreaAndMerchant(
            request.getAreaId(), merchantId);
        if (permissionCount == 0) {
            throw new BusinessException(ResultCode.STORE_AREA_NO_PERMISSION);
        }
        
        // 检查区域是否已有店铺
        int storeCount = storeMapper.countByAreaId(request.getAreaId());
        if (storeCount > 0) {
            throw new BusinessException(ResultCode.STORE_AREA_ALREADY_HAS_STORE);
        }
        
        // 创建店铺
        Store store = new Store();
        store.setStoreId(IdGenerator.nextId());
        store.setAreaId(request.getAreaId());
        store.setMerchantId(merchantId);
        store.setName(request.getName());
        store.setDescription(request.getDescription());
        store.setCategory(request.getCategory());
        store.setBusinessHours(request.getBusinessHours());
        store.setStatus(StoreStatus.PENDING);
        
        storeMapper.insert(store);
        
        return convertToDTO(store);
    }
    
    /**
     * 获取商家的店铺列表
     */
    public List<StoreDTO> getMyStores(String merchantId) {
        List<Store> stores = storeMapper.selectByMerchantId(merchantId);
        return stores.stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }
    
    /**
     * 获取店铺详情
     */
    public StoreDTO getStoreById(String storeId) {
        Store store = storeMapper.selectById(storeId);
        ValidationUtils.requireStoreExists(store);
        return convertToDTO(store);
    }
    
    /**
     * 更新店铺信息
     */
    @Transactional
    public StoreDTO updateStore(String merchantId, String storeId, UpdateStoreRequest request) {
        Store store = storeMapper.selectById(storeId);
        ValidationUtils.validateStoreOwnership(store, merchantId);
        
        // 更新字段
        if (StringUtils.hasText(request.getName())) {
            store.setName(request.getName());
        }
        if (request.getDescription() != null) {
            store.setDescription(request.getDescription());
        }
        if (StringUtils.hasText(request.getCategory())) {
            store.setCategory(request.getCategory());
        }
        if (request.getBusinessHours() != null) {
            store.setBusinessHours(request.getBusinessHours());
        }
        if (request.getLogo() != null) {
            store.setLogo(request.getLogo());
        }
        if (request.getCover() != null) {
            store.setCover(request.getCover());
        }
        
        storeMapper.updateById(store);
        
        return convertToDTO(store);
    }
    
    /**
     * 激活店铺（INACTIVE -> ACTIVE）
     */
    @Transactional
    public void activateStore(String merchantId, String storeId) {
        Store store = storeMapper.selectById(storeId);
        ValidationUtils.validateStoreOwnership(store, merchantId);
        
        if (store.getStatus() != StoreStatus.INACTIVE) {
            throw new BusinessException(ResultCode.STORE_INVALID_STATUS_TRANSITION);
        }
        
        store.setStatus(StoreStatus.ACTIVE);
        storeMapper.updateById(store);
    }
    
    /**
     * 暂停营业（ACTIVE -> INACTIVE）
     */
    @Transactional
    public void deactivateStore(String merchantId, String storeId) {
        Store store = storeMapper.selectById(storeId);
        ValidationUtils.validateStoreOwnership(store, merchantId);
        
        if (store.getStatus() != StoreStatus.ACTIVE) {
            throw new BusinessException(ResultCode.STORE_INVALID_STATUS_TRANSITION);
        }
        
        store.setStatus(StoreStatus.INACTIVE);
        storeMapper.updateById(store);
    }
    
    /**
     * 获取所有店铺（管理员，分页）
     */
    public IPage<StoreDTO> getAllStores(StoreQueryRequest query, int page, int size) {
        LambdaQueryWrapper<Store> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Store::getIsDeleted, false);
        
        if (StringUtils.hasText(query.getStatus())) {
            wrapper.eq(Store::getStatus, StoreStatus.valueOf(query.getStatus()));
        }
        if (StringUtils.hasText(query.getCategory())) {
            wrapper.eq(Store::getCategory, query.getCategory());
        }
        if (StringUtils.hasText(query.getMerchantId())) {
            wrapper.eq(Store::getMerchantId, query.getMerchantId());
        }
        if (StringUtils.hasText(query.getKeyword())) {
            wrapper.like(Store::getName, query.getKeyword());
        }
        
        wrapper.orderByDesc(Store::getCreateTime);
        
        Page<Store> pageParam = new Page<>(page, size);
        IPage<Store> storePage = storeMapper.selectPage(pageParam, wrapper);
        
        return storePage.convert(this::convertToDTO);
    }
    
    /**
     * 审批店铺（PENDING -> ACTIVE）
     */
    @Transactional
    public void approveStore(String adminId, String storeId) {
        Store store = storeMapper.selectById(storeId);
        ValidationUtils.requireStoreExists(store);
        
        if (store.getStatus() != StoreStatus.PENDING) {
            throw new BusinessException(ResultCode.STORE_INVALID_STATUS_TRANSITION);
        }
        
        store.setStatus(StoreStatus.ACTIVE);
        store.setApprovedAt(LocalDateTime.now());
        store.setApprovedBy(adminId);
        storeMapper.updateById(store);
    }
    
    /**
     * 关闭店铺（任意状态 -> CLOSED，除了已关闭的）
     */
    @Transactional
    public void closeStore(String adminId, String storeId, String reason) {
        Store store = storeMapper.selectById(storeId);
        ValidationUtils.requireStoreExists(store);
        
        if (store.getStatus() == StoreStatus.CLOSED) {
            throw new BusinessException(ResultCode.STORE_INVALID_STATUS_TRANSITION);
        }
        
        store.setStatus(StoreStatus.CLOSED);
        store.setCloseReason(reason);
        storeMapper.updateById(store);
    }
    
    /**
     * 转换为 DTO
     */
    private StoreDTO convertToDTO(Store store) {
        StoreDTO dto = new StoreDTO();
        dto.setStoreId(store.getStoreId());
        dto.setAreaId(store.getAreaId());
        dto.setMerchantId(store.getMerchantId());
        dto.setName(store.getName());
        dto.setDescription(store.getDescription());
        dto.setCategory(store.getCategory());
        dto.setBusinessHours(store.getBusinessHours());
        dto.setLogo(store.getLogo());
        dto.setCover(store.getCover());
        dto.setStatus(store.getStatus().name());
        dto.setCloseReason(store.getCloseReason());
        dto.setCreatedAt(store.getCreateTime());
        dto.setApprovedAt(store.getApprovedAt());
        
        // 获取区域信息
        Area area = areaMapper.selectById(store.getAreaId());
        if (area != null) {
            dto.setAreaName(area.getName());
            dto.setFloorId(area.getFloorId());
            
            // 获取楼层信息
            Floor floor = floorMapper.selectById(area.getFloorId());
            if (floor != null) {
                dto.setFloorName(floor.getName());
            }
        }
        
        // 获取商家信息
        User merchant = userMapper.selectById(store.getMerchantId());
        if (merchant != null) {
            dto.setMerchantName(merchant.getUsername());
        }
        
        return dto;
    }
}
