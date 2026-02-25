package com.smartmall.infrastructure.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.smartmall.domain.entity.UserCoupon;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.util.List;

/**
 * 用户优惠券 Mapper
 */
@Mapper
public interface UserCouponMapper extends BaseMapper<UserCoupon> {

    /**
     * 统计用户可用优惠券数
     */
    @Select("""
        SELECT COUNT(*)
        FROM user_coupon
        WHERE user_id = #{userId}
          AND status = 'UNUSED'
          AND expires_at > NOW()
          AND is_deleted = FALSE
        """)
    long countAvailableByUserId(@Param("userId") String userId);

    /**
     * 查询用户优惠券列表
     */
    @Select("SELECT * FROM user_coupon WHERE user_id = #{userId} AND is_deleted = FALSE ORDER BY created_at DESC LIMIT #{limit}")
    List<UserCoupon> selectByUserIdWithLimit(@Param("userId") String userId, @Param("limit") int limit);

    /**
     * 查询用户可用优惠券（按过期时间升序）
     */
    @Select("""
        SELECT *
        FROM user_coupon
        WHERE user_id = #{userId}
          AND status = 'UNUSED'
          AND expires_at > NOW()
          AND is_deleted = FALSE
        ORDER BY expires_at ASC
        """)
    List<UserCoupon> selectAvailableByUserId(@Param("userId") String userId);

    /**
     * 使用优惠券
     */
    @Update("""
        UPDATE user_coupon
        SET status = 'USED',
            used_at = NOW(),
            updated_at = NOW()
        WHERE coupon_id = #{couponId}
          AND user_id = #{userId}
          AND status = 'UNUSED'
          AND expires_at > NOW()
          AND is_deleted = FALSE
        """)
    int markCouponUsed(@Param("userId") String userId, @Param("couponId") String couponId);
}
