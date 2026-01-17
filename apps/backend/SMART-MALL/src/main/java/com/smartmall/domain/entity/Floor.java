package com.smartmall.domain.entity;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.smartmall.infrastructure.config.PostgresJsonbTypeHandler;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

/**
 * 楼层实体
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName(value = "floor", autoResultMap = true)
public class Floor extends BaseEntity {
    
    @TableId
    private String floorId;
    
    private String projectId;
    
    private String name;
    
    private Integer level;
    
    private BigDecimal height;
    
    @TableField(typeHandler = PostgresJsonbTypeHandler.class)
    private Map<String, Object> shape;
    
    private Boolean inheritOutline;
    
    private String color;
    
    private Boolean visible;
    
    private Boolean locked;
    
    private Integer sortOrder;
    
    /**
     * 区域列表（非数据库字段）
     */
    @TableField(exist = false)
    private List<Area> areas;
}
