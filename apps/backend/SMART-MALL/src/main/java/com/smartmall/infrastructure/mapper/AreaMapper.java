package com.smartmall.infrastructure.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.smartmall.domain.entity.Area;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.util.List;

/**
 * 区域 Mapper
 */
@Mapper
public interface AreaMapper extends BaseMapper<Area> {
    
    /**
     * 根据楼层ID软删除所有区域
     */
    @Update("UPDATE area SET is_deleted = TRUE, updated_at = NOW() WHERE floor_id = #{floorId}")
    void softDeleteByFloorId(@Param("floorId") String floorId);
    
    /**
     * 更新区域状态
     */
    @Update("UPDATE area SET status = #{status}, merchant_id = #{merchantId}, updated_at = NOW() WHERE area_id = #{areaId}")
    void updateStatus(@Param("areaId") String areaId, @Param("status") String status, @Param("merchantId") String merchantId);
    
    /**
     * 根据状态查询区域
     */
    @Select("SELECT * FROM area WHERE status = #{status} AND is_deleted = FALSE")
    List<Area> selectByStatus(@Param("status") String status);
}
