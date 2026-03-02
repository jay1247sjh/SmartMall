package com.smartmall.interfaces.dto.merchant;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 提交建模提案请求
 */
@Data
public class SubmitLayoutProposalRequest {

    @NotNull(message = "布局数据不能为空")
    private StoreLayoutResponse.StoreLayoutData layoutData;

    private String submitNote;
}

