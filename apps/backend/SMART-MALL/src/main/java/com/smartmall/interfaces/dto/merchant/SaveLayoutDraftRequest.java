package com.smartmall.interfaces.dto.merchant;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 保存建模草稿请求
 */
@Data
public class SaveLayoutDraftRequest {

    @NotNull(message = "布局数据不能为空")
    private StoreLayoutResponse.StoreLayoutData layoutData;
}

