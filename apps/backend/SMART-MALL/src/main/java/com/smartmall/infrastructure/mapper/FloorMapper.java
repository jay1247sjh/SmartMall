package com.smartmall.infrastructure.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.smartmall.domain.entity.Floor;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Update;

import java.util.List;

/**
 * 楼层 Mapper
 */
@Mapper
public interface FloorMapper extends BaseMapper<Floor> {
    
    /**
     * 根据项目ID软删除所有楼层
     */
    @Update("UPDATE floor SET is_deleted = TRUE, updated_at = NOW() WHERE project_id = #{projectId}")
    void softDeleteByProjectId(@Param("projectId") String projectId);
}
