package com.smartmall.infrastructure.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.smartmall.domain.entity.NavigationDynamicEvent;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.time.LocalDateTime;
import java.util.List;

@Mapper
public interface NavigationDynamicEventMapper extends BaseMapper<NavigationDynamicEvent> {

    @Select("""
            SELECT *
            FROM navigation_dynamic_event
            WHERE project_id = #{projectId}
              AND status = 'ACTIVE'
              AND is_deleted = FALSE
              AND starts_at <= #{now}
              AND (ends_at IS NULL OR ends_at >= #{now})
            ORDER BY updated_at DESC
            """)
    List<NavigationDynamicEvent> selectActiveByProjectAt(
            @Param("projectId") String projectId,
            @Param("now") LocalDateTime now
    );
}

