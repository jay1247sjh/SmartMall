package com.smartmall.interfaces.dto.user;

import lombok.Data;

/**
 * 用户侧店铺简要信息 DTO
 */
@Data
public class UserStoreBriefDTO {

    private String storeId;

    private String name;

    private String category;
}
