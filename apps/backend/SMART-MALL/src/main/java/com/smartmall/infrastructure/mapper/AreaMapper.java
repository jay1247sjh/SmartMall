package com.smartmall.infrastructure.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.smartmall.domain.entity.Area;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Update;

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
}
