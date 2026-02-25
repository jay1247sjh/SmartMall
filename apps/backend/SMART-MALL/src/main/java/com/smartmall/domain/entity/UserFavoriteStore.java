package com.smartmall.domain.entity;

import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 用户收藏店铺实体
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("user_favorite_store")
public class UserFavoriteStore extends BaseEntity {

    /**
     * 收藏记录ID
     */
    @TableId
    private String favoriteId;

    /**
     * 用户ID
     */
    private String userId;

    /**
     * 店铺ID
     */
    private String storeId;
}
