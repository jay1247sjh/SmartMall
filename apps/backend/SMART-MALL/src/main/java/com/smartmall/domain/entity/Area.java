package com.smartmall.domain.entity;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.extension.handlers.JacksonTypeHandler;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.Map;

/**
 * 区域实体
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName(value = "area", autoResultMap = true)
public class Area extends BaseEntity {
    
    @TableId
    private String areaId;
    
    private String floorId;
    
    private String name;
    
    private String type;
    
    @TableField(typeHandler = JacksonTypeHandler.class)
    private Map<String, Object> shape;
    
    private String color;
    
    @TableField(typeHandler = JacksonTypeHandler.class)
    private Map<String, Object> properties;
    
    private String merchantId;
    
    @TableField(typeHandler = JacksonTypeHandler.class)
    private Map<String, Object> rental;
    
    private Boolean visible;
    
    private Boolean locked;
}
