package com.smartmall.infrastructure.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.smartmall.domain.entity.UserFavoriteStore;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.util.List;

/**
 * 用户收藏店铺 Mapper
 */
@Mapper
public interface UserFavoriteStoreMapper extends BaseMapper<UserFavoriteStore> {

    /**
     * 统计用户收藏店铺数
     */
    @Select("SELECT COUNT(*) FROM user_favorite_store WHERE user_id = #{userId} AND is_deleted = FALSE")
    long countByUserId(@Param("userId") String userId);

    /**
     * 查询用户收藏店铺 ID 列表
     */
    @Select("SELECT store_id FROM user_favorite_store WHERE user_id = #{userId} AND is_deleted = FALSE ORDER BY created_at DESC")
    List<String> selectStoreIdsByUserId(@Param("userId") String userId);

    /**
     * 判断是否已收藏
     */
    @Select("SELECT COUNT(*) FROM user_favorite_store WHERE user_id = #{userId} AND store_id = #{storeId} AND is_deleted = FALSE")
    int countActiveByUserAndStore(@Param("userId") String userId, @Param("storeId") String storeId);

    /**
     * 取消收藏（逻辑删除）
     */
    @Update("UPDATE user_favorite_store SET is_deleted = TRUE, updated_at = NOW() WHERE user_id = #{userId} AND store_id = #{storeId} AND is_deleted = FALSE")
    int softDeleteByUserAndStore(@Param("userId") String userId, @Param("storeId") String storeId);
}
