package com.smartmall.infrastructure.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.smartmall.domain.entity.UserBrowseHistory;
import com.smartmall.interfaces.dto.dashboard.UserDailyCountDTO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 用户浏览记录 Mapper
 */
@Mapper
public interface UserBrowseHistoryMapper extends BaseMapper<UserBrowseHistory> {

    /**
     * 统计用户浏览记录数
     */
    @Select("SELECT COUNT(*) FROM user_browse_history WHERE user_id = #{userId} AND is_deleted = FALSE")
    long countByUserId(@Param("userId") String userId);

    /**
     * 按天统计用户浏览数
     */
    @Select("""
        SELECT DATE(browse_at) AS day, COUNT(*) AS total
        FROM user_browse_history
        WHERE user_id = #{userId}
          AND is_deleted = FALSE
          AND browse_at >= #{startTime}
        GROUP BY DATE(browse_at)
        ORDER BY day ASC
        """)
    List<UserDailyCountDTO> countDailyByUserId(
            @Param("userId") String userId,
            @Param("startTime") LocalDateTime startTime);
}
