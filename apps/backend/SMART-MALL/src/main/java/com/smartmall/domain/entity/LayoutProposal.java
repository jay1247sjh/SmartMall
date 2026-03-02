package com.smartmall.domain.entity;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.smartmall.domain.enums.LayoutProposalStatus;
import com.smartmall.infrastructure.config.PostgresJsonbTypeHandler;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * 区域建模提案实体
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName(value = "layout_proposal", autoResultMap = true)
public class LayoutProposal extends BaseEntity {

    @TableId
    private String proposalId;

    private String areaId;

    private String merchantId;

    private LayoutProposalStatus status;

    @TableField(typeHandler = PostgresJsonbTypeHandler.class)
    private Map<String, Object> layoutData;

    private String submitNote;

    private String reviewedBy;

    private LocalDateTime reviewedAt;

    private String rejectReason;
}

