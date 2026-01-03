package com.smartmall.infrastructure.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.smartmall.domain.entity.User;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Update;

/**
 * 用户 Mapper
 */
@Mapper
public interface UserMapper extends BaseMapper<User> {
    
    /**
     * 更新最后登录时间
     */
    @Update("UPDATE \"user\" SET last_login_time = NOW() WHERE user_id = #{userId}")
    void updateLastLoginTime(@Param("userId") String userId);
    
    /**
     * 更新用户密码
     */
    @Update("UPDATE \"user\" SET password_hash = #{passwordHash}, updated_at = NOW() WHERE user_id = #{userId}")
    void updatePassword(@Param("userId") String userId, @Param("passwordHash") String passwordHash);
}
