package com.smartmall.domain.entity;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.smartmall.infrastructure.config.PostgresJsonbTypeHandler;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.List;
import java.util.Map;

/**
 * 商城项目实体
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName(value = "mall_project", autoResultMap = true)
public class MallProject extends BaseEntity {
    
    @TableId
    private String projectId;
    
    private String name;
    
    private String description;
    
    @TableField(typeHandler = PostgresJsonbTypeHandler.class)
    private Map<String, Object> outline;
    
    @TableField(typeHandler = PostgresJsonbTypeHandler.class)
    private Map<String, Object> settings;
    
    @TableField(typeHandler = PostgresJsonbTypeHandler.class)
    private Map<String, Object> metadata;
    
    private String creatorId;
    
    /**
     * 楼层列表（非数据库字段）
     */
    @TableField(exist = false)
    private List<Floor> floors;
}
