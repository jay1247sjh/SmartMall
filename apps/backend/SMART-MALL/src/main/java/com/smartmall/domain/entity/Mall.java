package com.smartmall.domain.entity;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.extension.handlers.JacksonTypeHandler;
import com.smartmall.domain.enums.MallStatus;
import lombok.Data;
import lombok.EqualsAndHashCode;
import java.util.Map;

/**
 * 商城实体
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName(value = "mall", autoResultMap = true)
public class Mall extends BaseEntity {
    
    @TableId
    private String mallId;
    
    private String name;
    
    private String description;
    
    @TableField(typeHandler = JacksonTypeHandler.class)
    private Map<String, Object> locationMeta;
    
    private String currentLayoutVersion;
    
    private MallStatus status;
    
    @TableField(typeHandler = JacksonTypeHandler.class)
    private Map<String, Object> config;
}
