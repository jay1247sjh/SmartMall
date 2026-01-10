package com.smartmall.interfaces.dto.store;

import lombok.Data;

/**
 * 店铺查询请求
 */
@Data
public class StoreQueryRequest {
    
    /**
     * 店铺状态筛选
     */
    private String status;
    
    /**
     * 店铺分类筛选
     */
    private String category;
    
    /**
     * 楼层ID筛选
     */
    private String floorId;
    
    /**
     * 商家ID筛选
     */
    private String merchantId;
    
    /**
     * 关键词搜索（店铺名称）
     */
    private String keyword;
}
