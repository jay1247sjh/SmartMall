package com.smartmall.domain.entity;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.smartmall.infrastructure.config.PostgresJsonbTypeHandler;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.Map;

/**
 * 布局版本实体
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName(value = "layout_version", autoResultMap = true)
public class LayoutVersion extends BaseEntity {

    @TableId
    private String versionId;

    private String versionNumber;

    /**
     * 版本状态：ACTIVE | PUBLISHED | ARCHIVED
     */
    private String status;

    private String description;

    @TableField(typeHandler = PostgresJsonbTypeHandler.class)
    private Map<String, Object> snapshotData;

    private String sourceProjectId;

    private Integer schemaVersion;

    private Integer changeCount;

    private String creatorId;
}
