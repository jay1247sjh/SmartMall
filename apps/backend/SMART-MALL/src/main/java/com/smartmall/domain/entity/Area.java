package com.smartmall.domain.entity;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.smartmall.infrastructure.config.PostgresJsonbTypeHandler;
import com.smartmall.domain.enums.AreaStatus;
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
    
    @TableField(typeHandler = PostgresJsonbTypeHandler.class)
    private Map<String, Object> shape;
    
    private String color;
    
    @TableField(typeHandler = PostgresJsonbTypeHandler.class)
    private Map<String, Object> properties;
    
    private String merchantId;
    
    @TableField(typeHandler = PostgresJsonbTypeHandler.class)
    private Map<String, Object> rental;
    
    private Boolean visible;
    
    private Boolean locked;
    
    /**
     * 区域状态: AVAILABLE(可申请), OCCUPIED(已占用), LOCKED(锁定)
     */
    private AreaStatus status;
}
