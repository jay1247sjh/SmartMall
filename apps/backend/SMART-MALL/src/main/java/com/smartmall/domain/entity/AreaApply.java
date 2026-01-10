package com.smartmall.domain.entity;

import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.smartmall.domain.enums.ApplyStatus;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

/**
 * 区域权限申请实体
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("area_apply")
public class AreaApply extends BaseEntity {
    
    /**
     * 申请ID
     */
    @TableId
    private String applyId;
    
    /**
     * 区域ID
     */
    private String areaId;
    
    /**
     * 商家ID
     */
    private String merchantId;
    
    /**
     * 申请状态
     */
    private ApplyStatus status;
    
    /**
     * 申请理由
     */
    private String applyReason;
    
    /**
     * 驳回理由
     */
    private String rejectReason;
    
    /**
     * 审批通过时间
     */
    private LocalDateTime approvedAt;
    
    /**
     * 驳回时间
     */
    private LocalDateTime rejectedAt;
    
    /**
     * 审批人ID
     */
    private String approvedBy;
}
