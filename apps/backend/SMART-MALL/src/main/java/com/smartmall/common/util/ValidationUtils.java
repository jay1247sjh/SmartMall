package com.smartmall.common.util;

import com.smartmall.common.exception.BusinessException;
import com.smartmall.common.response.ResultCode;
import com.smartmall.domain.entity.Product;
import com.smartmall.domain.entity.Store;

/**
 * 通用验证工具类
 * 
 * 提供实体存在性验证、所有权验证等通用方法，
 * 减少服务层的重复代码
 */
public final class ValidationUtils {
    
    private ValidationUtils() {
        // 工具类不允许实例化
    }
    
    /**
     * 验证实体非空
     * 
     * @param entity 实体对象
     * @param notFoundCode 未找到时的错误码
     * @param <T> 实体类型
     * @return 实体对象（非空）
     * @throws BusinessException 如果实体为空
     */
    public static <T> T requireNonNull(T entity, ResultCode notFoundCode) {
        if (entity == null) {
            throw new BusinessException(notFoundCode);
        }
        return entity;
    }
    
    /**
     * 验证实体存在且未被删除
     * 
     * @param entity 实体对象
     * @param isDeleted 是否已删除
     * @param notFoundCode 未找到时的错误码
     * @param <T> 实体类型
     * @return 实体对象（非空且未删除）
     * @throws BusinessException 如果实体为空或已删除
     */
    public static <T> T requireNonDeleted(T entity, boolean isDeleted, ResultCode notFoundCode) {
        if (entity == null || isDeleted) {
            throw new BusinessException(notFoundCode);
        }
        return entity;
    }
    
    /**
     * 验证所有权
     * 
     * @param actualOwnerId 实际所有者 ID
     * @param expectedOwnerId 期望的所有者 ID
     * @param notOwnerCode 非所有者时的错误码
     * @throws BusinessException 如果所有权验证失败
     */
    public static void validateOwnership(String actualOwnerId, String expectedOwnerId, ResultCode notOwnerCode) {
        if (actualOwnerId == null || !actualOwnerId.equals(expectedOwnerId)) {
            throw new BusinessException(notOwnerCode);
        }
    }
    
    /**
     * 验证店铺存在性（带软删除检查）
     * 
     * @param store 店铺实体
     * @return 店铺实体（非空且未删除）
     * @throws BusinessException 如果店铺不存在或已删除
     */
    public static Store requireStoreExists(Store store) {
        return requireNonDeleted(
            store, 
            store != null && store.getIsDeleted(), 
            ResultCode.STORE_NOT_FOUND
        );
    }
    
    /**
     * 验证店铺所有权（组合验证：存在性 + 所有权）
     * 
     * @param store 店铺实体
     * @param merchantId 商家 ID
     * @return 店铺实体
     * @throws BusinessException 如果店铺不存在或非所有者
     */
    public static Store validateStoreOwnership(Store store, String merchantId) {
        requireStoreExists(store);
        validateOwnership(store.getMerchantId(), merchantId, ResultCode.STORE_NOT_OWNER);
        return store;
    }
    
    /**
     * 验证商品存在性
     * 
     * @param product 商品实体
     * @return 商品实体（非空）
     * @throws BusinessException 如果商品不存在
     */
    public static Product requireProductExists(Product product) {
        return requireNonNull(product, ResultCode.PRODUCT_NOT_FOUND);
    }
}
