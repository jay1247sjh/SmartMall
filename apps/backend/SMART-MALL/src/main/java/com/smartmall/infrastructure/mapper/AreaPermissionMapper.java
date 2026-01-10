package com.smartmall.infrastructure.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.smartmall.domain.entity.AreaPermission;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * 区域权限 Mapper
 */
@Mapper
public interface AreaPermissionMapper extends BaseMapper<AreaPermission> {
    
    /**
     * 查询商家的有效权限列表
     */
    @Select("SELECT * FROM area_permission WHERE merchant_id = #{merchantId} AND status = 'ACTIVE' AND is_deleted = FALSE")
    List<AreaPermission> selectActiveByMerchantId(@Param("merchantId") String merchantId);
    
    /**
     * 查询区域的有效权限
     */
    @Select("SELECT * FROM area_permission WHERE area_id = #{areaId} AND status = 'ACTIVE' AND is_deleted = FALSE LIMIT 1")
    AreaPermission selectActiveByAreaId(@Param("areaId") String areaId);
    
    /**
     * 检查商家是否有区域的有效权限
     */
    @Select("SELECT COUNT(*) FROM area_permission WHERE area_id = #{areaId} AND merchant_id = #{merchantId} AND status = 'ACTIVE' AND is_deleted = FALSE")
    int countActiveByAreaAndMerchant(@Param("areaId") String areaId, @Param("merchantId") String merchantId);
}
