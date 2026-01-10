package com.smartmall.interfaces.dto.permission;

import lombok.Data;
import java.time.LocalDateTime;

/**
 * 区域权限申请 DTO
 */
@Data
public class AreaApplyDTO {
    
    /**
     * 申请ID
     */
    private String applyId;
    
    /**
     * 区域ID
     */
    private String areaId;
    
    /**
     * 区域名称
     */
    private String areaName;
    
    /**
     * 楼层名称
     */
    private String floorName;
    
    /**
     * 商家ID
     */
    private String merchantId;
    
    /**
     * 商家名称
     */
    private String merchantName;
    
    /**
     * 申请状态
     */
    private String status;
    
    /**
     * 申请理由
     */
    private String applyReason;
    
    /**
     * 驳回理由
     */
    private String rejectReason;
    
    /**
     * 创建时间
     */
    private LocalDateTime createdAt;
    
    /**
     * 审批通过时间
     */
    private LocalDateTime approvedAt;
    
    /**
     * 驳回时间
     */
    private LocalDateTime rejectedAt;
}
