package com.smartmall.infrastructure.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.smartmall.domain.entity.Store;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * 店铺 Mapper
 */
@Mapper
public interface StoreMapper extends BaseMapper<Store> {
    
    /**
     * 查询商家的所有店铺
     */
    @Select("SELECT * FROM store WHERE merchant_id = #{merchantId} AND is_deleted = FALSE ORDER BY created_at DESC")
    List<Store> selectByMerchantId(@Param("merchantId") String merchantId);
    
    /**
     * 查询区域的店铺
     */
    @Select("SELECT * FROM store WHERE area_id = #{areaId} AND is_deleted = FALSE LIMIT 1")
    Store selectByAreaId(@Param("areaId") String areaId);
    
    /**
     * 检查区域是否已有店铺
     */
    @Select("SELECT COUNT(*) FROM store WHERE area_id = #{areaId} AND is_deleted = FALSE")
    int countByAreaId(@Param("areaId") String areaId);
    
    /**
     * 按状态查询店铺
     */
    @Select("SELECT * FROM store WHERE status = #{status} AND is_deleted = FALSE ORDER BY created_at DESC")
    List<Store> selectByStatus(@Param("status") String status);
    
    /**
     * 按分类查询店铺
     */
    @Select("SELECT * FROM store WHERE category = #{category} AND is_deleted = FALSE ORDER BY created_at DESC")
    List<Store> selectByCategory(@Param("category") String category);
}
