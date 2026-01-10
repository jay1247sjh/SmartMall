package com.smartmall.application.service;

import com.smartmall.common.exception.BusinessException;
import com.smartmall.common.response.ResultCode;
import com.smartmall.domain.entity.Store;
import com.smartmall.domain.enums.StoreStatus;
import com.smartmall.infrastructure.mapper.*;
import com.smartmall.interfaces.dto.store.CreateStoreRequest;
import com.smartmall.interfaces.dto.store.StoreDTO;
import com.smartmall.interfaces.dto.store.UpdateStoreRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * StoreService 单元测试
 */
@ExtendWith(MockitoExtension.class)
class StoreServiceTest {
    
    @Mock
    private StoreMapper storeMapper;
    
    @Mock
    private AreaMapper areaMapper;
    
    @Mock
    private FloorMapper floorMapper;
    
    @Mock
    private UserMapper userMapper;
    
    @Mock
    private AreaPermissionMapper areaPermissionMapper;
    
    @InjectMocks
    private StoreService storeService;
    
    private static final String MERCHANT_ID = "merchant-001";
    private static final String AREA_ID = "area-001";
    private static final String STORE_ID = "store-001";
    private static final String ADMIN_ID = "admin-001";
    
    @BeforeEach
    void setUp() {
        // 通用设置
    }
    
    // ========== 创建店铺测试 ==========
    
    @Test
    @DisplayName("创建店铺 - 成功：有权限且区域无店铺")
    void createStore_Success() {
        // Given
        CreateStoreRequest request = new CreateStoreRequest();
        request.setAreaId(AREA_ID);
        request.setName("测试店铺");
        request.setCategory("餐饮");
        request.setBusinessHours("09:00-22:00");
        
        when(areaPermissionMapper.countActiveByAreaAndMerchant(AREA_ID, MERCHANT_ID)).thenReturn(1);
        when(storeMapper.countByAreaId(AREA_ID)).thenReturn(0);
        when(storeMapper.insert(any(Store.class))).thenReturn(1);
        
        // When
        StoreDTO result = storeService.createStore(MERCHANT_ID, request);
        
        // Then
        assertNotNull(result);
        assertEquals("测试店铺", result.getName());
        assertEquals("餐饮", result.getCategory());
        assertEquals("PENDING", result.getStatus());
        verify(storeMapper).insert(any(Store.class));
    }
    
    @Test
    @DisplayName("创建店铺 - 失败：无区域权限")
    void createStore_NoPermission() {
        // Given
        CreateStoreRequest request = new CreateStoreRequest();
        request.setAreaId(AREA_ID);
        request.setName("测试店铺");
        request.setCategory("餐饮");
        
        when(areaPermissionMapper.countActiveByAreaAndMerchant(AREA_ID, MERCHANT_ID)).thenReturn(0);
        
        // When & Then
        BusinessException exception = assertThrows(BusinessException.class, 
            () -> storeService.createStore(MERCHANT_ID, request));
        assertEquals(ResultCode.STORE_AREA_NO_PERMISSION, exception.getResultCode());
    }
    
    @Test
    @DisplayName("创建店铺 - 失败：区域已有店铺")
    void createStore_AreaAlreadyHasStore() {
        // Given
        CreateStoreRequest request = new CreateStoreRequest();
        request.setAreaId(AREA_ID);
        request.setName("测试店铺");
        request.setCategory("餐饮");
        
        when(areaPermissionMapper.countActiveByAreaAndMerchant(AREA_ID, MERCHANT_ID)).thenReturn(1);
        when(storeMapper.countByAreaId(AREA_ID)).thenReturn(1);
        
        // When & Then
        BusinessException exception = assertThrows(BusinessException.class, 
            () -> storeService.createStore(MERCHANT_ID, request));
        assertEquals(ResultCode.STORE_AREA_ALREADY_HAS_STORE, exception.getResultCode());
    }
    
    // ========== 更新店铺测试 ==========
    
    @Test
    @DisplayName("更新店铺 - 成功：店铺所有者")
    void updateStore_Success() {
        // Given
        Store existingStore = createTestStore(STORE_ID, MERCHANT_ID, StoreStatus.ACTIVE);
        UpdateStoreRequest request = new UpdateStoreRequest();
        request.setName("新店铺名称");
        request.setDescription("新描述");
        
        when(storeMapper.selectById(STORE_ID)).thenReturn(existingStore);
        when(storeMapper.updateById(any(Store.class))).thenReturn(1);
        
        // When
        StoreDTO result = storeService.updateStore(MERCHANT_ID, STORE_ID, request);
        
        // Then
        assertNotNull(result);
        assertEquals("新店铺名称", result.getName());
        verify(storeMapper).updateById(any(Store.class));
    }
    
    @Test
    @DisplayName("更新店铺 - 失败：非店铺所有者")
    void updateStore_NotOwner() {
        // Given
        Store existingStore = createTestStore(STORE_ID, "other-merchant", StoreStatus.ACTIVE);
        UpdateStoreRequest request = new UpdateStoreRequest();
        request.setName("新店铺名称");
        
        when(storeMapper.selectById(STORE_ID)).thenReturn(existingStore);
        
        // When & Then
        BusinessException exception = assertThrows(BusinessException.class, 
            () -> storeService.updateStore(MERCHANT_ID, STORE_ID, request));
        assertEquals(ResultCode.STORE_NOT_OWNER, exception.getResultCode());
    }
    
    // ========== 状态转换测试 ==========
    
    @Test
    @DisplayName("激活店铺 - 成功：INACTIVE -> ACTIVE")
    void activateStore_Success() {
        // Given
        Store store = createTestStore(STORE_ID, MERCHANT_ID, StoreStatus.INACTIVE);
        when(storeMapper.selectById(STORE_ID)).thenReturn(store);
        when(storeMapper.updateById(any(Store.class))).thenReturn(1);
        
        // When
        storeService.activateStore(MERCHANT_ID, STORE_ID);
        
        // Then
        assertEquals(StoreStatus.ACTIVE, store.getStatus());
        verify(storeMapper).updateById(store);
    }
    
    @Test
    @DisplayName("激活店铺 - 失败：非 INACTIVE 状态")
    void activateStore_InvalidStatus() {
        // Given
        Store store = createTestStore(STORE_ID, MERCHANT_ID, StoreStatus.PENDING);
        when(storeMapper.selectById(STORE_ID)).thenReturn(store);
        
        // When & Then
        BusinessException exception = assertThrows(BusinessException.class, 
            () -> storeService.activateStore(MERCHANT_ID, STORE_ID));
        assertEquals(ResultCode.STORE_INVALID_STATUS_TRANSITION, exception.getResultCode());
    }
    
    @Test
    @DisplayName("暂停营业 - 成功：ACTIVE -> INACTIVE")
    void deactivateStore_Success() {
        // Given
        Store store = createTestStore(STORE_ID, MERCHANT_ID, StoreStatus.ACTIVE);
        when(storeMapper.selectById(STORE_ID)).thenReturn(store);
        when(storeMapper.updateById(any(Store.class))).thenReturn(1);
        
        // When
        storeService.deactivateStore(MERCHANT_ID, STORE_ID);
        
        // Then
        assertEquals(StoreStatus.INACTIVE, store.getStatus());
        verify(storeMapper).updateById(store);
    }
    
    @Test
    @DisplayName("审批店铺 - 成功：PENDING -> ACTIVE")
    void approveStore_Success() {
        // Given
        Store store = createTestStore(STORE_ID, MERCHANT_ID, StoreStatus.PENDING);
        when(storeMapper.selectById(STORE_ID)).thenReturn(store);
        when(storeMapper.updateById(any(Store.class))).thenReturn(1);
        
        // When
        storeService.approveStore(ADMIN_ID, STORE_ID);
        
        // Then
        assertEquals(StoreStatus.ACTIVE, store.getStatus());
        assertNotNull(store.getApprovedAt());
        assertEquals(ADMIN_ID, store.getApprovedBy());
    }
    
    @Test
    @DisplayName("关闭店铺 - 成功")
    void closeStore_Success() {
        // Given
        Store store = createTestStore(STORE_ID, MERCHANT_ID, StoreStatus.ACTIVE);
        when(storeMapper.selectById(STORE_ID)).thenReturn(store);
        when(storeMapper.updateById(any(Store.class))).thenReturn(1);
        
        // When
        storeService.closeStore(ADMIN_ID, STORE_ID, "违规经营");
        
        // Then
        assertEquals(StoreStatus.CLOSED, store.getStatus());
        assertEquals("违规经营", store.getCloseReason());
    }
    
    @Test
    @DisplayName("关闭店铺 - 失败：已关闭的店铺")
    void closeStore_AlreadyClosed() {
        // Given
        Store store = createTestStore(STORE_ID, MERCHANT_ID, StoreStatus.CLOSED);
        when(storeMapper.selectById(STORE_ID)).thenReturn(store);
        
        // When & Then
        BusinessException exception = assertThrows(BusinessException.class, 
            () -> storeService.closeStore(ADMIN_ID, STORE_ID, "再次关闭"));
        assertEquals(ResultCode.STORE_INVALID_STATUS_TRANSITION, exception.getResultCode());
    }
    
    // ========== 辅助方法 ==========
    
    private Store createTestStore(String storeId, String merchantId, StoreStatus status) {
        Store store = new Store();
        store.setStoreId(storeId);
        store.setMerchantId(merchantId);
        store.setAreaId(AREA_ID);
        store.setName("测试店铺");
        store.setCategory("餐饮");
        store.setStatus(status);
        store.setIsDeleted(false);
        return store;
    }
}
