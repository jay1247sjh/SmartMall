package com.smartmall.domain.entity;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

/**
 * 用户浏览记录实体
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("user_browse_history")
public class UserBrowseHistory extends BaseEntity {

    /**
     * 浏览记录ID
     */
    @TableId
    private String historyId;

    /**
     * 用户ID
     */
    private String userId;

    /**
     * 店铺ID
     */
    private String storeId;

    /**
     * 浏览时间
     */
    @TableField("browse_at")
    private LocalDateTime browseAt;
}
