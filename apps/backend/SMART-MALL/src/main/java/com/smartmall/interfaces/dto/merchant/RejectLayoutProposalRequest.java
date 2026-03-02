package com.smartmall.interfaces.dto.merchant;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 驳回建模提案请求
 */
@Data
public class RejectLayoutProposalRequest {

    @NotBlank(message = "驳回理由不能为空")
    private String reason;
}

