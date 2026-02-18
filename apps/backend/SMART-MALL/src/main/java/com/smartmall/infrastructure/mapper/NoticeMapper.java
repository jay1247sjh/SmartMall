package com.smartmall.infrastructure.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.smartmall.domain.entity.Notice;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * 系统公告 Mapper
 */
@Mapper
public interface NoticeMapper extends BaseMapper<Notice> {

    /**
     * 查询活跃公告，按发布时间倒序排列，限制返回数量
     */
    @Select("SELECT * FROM notice WHERE is_active = true AND is_deleted = false ORDER BY published_at DESC LIMIT #{limit}")
    List<Notice> selectActiveNotices(@Param("limit") int limit);
}
