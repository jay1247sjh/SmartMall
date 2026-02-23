package com.smartmall.interfaces.dto.user;

import lombok.Data;

/**
 * 用户列表查询请求
 */
@Data
public class UserListRequest {
    
    /** 搜索关键词（用户名或邮箱） */
    private String keyword;
    
    /** 用户类型筛选：ALL / ADMIN / MERCHANT / USER */
    private String userType;
    
    /** 用户状态筛选：ALL / ACTIVE / FROZEN / DELETED */
    private String status;
    
    /** 页码（从 1 开始） */
    private Integer page = 1;
    
    /** 每页数量 */
    private Integer pageSize = 10;
}
