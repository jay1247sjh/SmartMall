package com.smartmall.infrastructure.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.smartmall.domain.entity.LayoutVersion;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

/**
 * 布局版本 Mapper
 */
@Mapper
public interface LayoutVersionMapper extends BaseMapper<LayoutVersion> {

    /**
     * 统计指定项目的所有版本数量（包括已删除的），用于版本号生成
     * 绕过 @TableLogic 的自动过滤，确保版本号全局唯一
     */
    @Select("SELECT COUNT(*) FROM layout_version WHERE source_project_id = #{projectId}")
    long countAllByProjectId(@Param("projectId") String projectId);
}
