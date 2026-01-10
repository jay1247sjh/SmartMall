package com.smartmall.infrastructure.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.smartmall.domain.entity.AreaApply;
import com.smartmall.domain.enums.ApplyStatus;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * 区域权限申请 Mapper
 */
@Mapper
public interface AreaApplyMapper extends BaseMapper<AreaApply> {
    
    /**
     * 查询商家的申请列表
     */
    @Select("SELECT * FROM area_apply WHERE merchant_id = #{merchantId} AND is_deleted = FALSE ORDER BY created_at DESC")
    List<AreaApply> selectByMerchantId(@Param("merchantId") String merchantId);
    
    /**
     * 查询指定状态的申请列表
     */
    @Select("SELECT * FROM area_apply WHERE status = #{status} AND is_deleted = FALSE ORDER BY created_at ASC")
    List<AreaApply> selectByStatus(@Param("status") String status);
    
    /**
     * 检查是否存在待审批的申请
     */
    @Select("SELECT COUNT(*) FROM area_apply WHERE area_id = #{areaId} AND status = 'PENDING' AND is_deleted = FALSE")
    int countPendingByAreaId(@Param("areaId") String areaId);
    
    /**
     * 检查商家是否已对该区域有待审批申请
     */
    @Select("SELECT COUNT(*) FROM area_apply WHERE area_id = #{areaId} AND merchant_id = #{merchantId} AND status = 'PENDING' AND is_deleted = FALSE")
    int countPendingByAreaAndMerchant(@Param("areaId") String areaId, @Param("merchantId") String merchantId);
}
