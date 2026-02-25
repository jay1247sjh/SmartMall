package com.smartmall.infrastructure.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.smartmall.domain.entity.UserOrder;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * 用户订单 Mapper
 */
@Mapper
public interface UserOrderMapper extends BaseMapper<UserOrder> {

    /**
     * 统计用户订单数
     */
    @Select("SELECT COUNT(*) FROM user_order WHERE user_id = #{userId} AND is_deleted = FALSE")
    long countByUserId(@Param("userId") String userId);

    /**
     * 查询用户订单（按时间倒序）
     */
    @Select("SELECT * FROM user_order WHERE user_id = #{userId} AND is_deleted = FALSE ORDER BY created_at DESC LIMIT #{limit}")
    List<UserOrder> selectByUserIdWithLimit(@Param("userId") String userId, @Param("limit") int limit);
}
