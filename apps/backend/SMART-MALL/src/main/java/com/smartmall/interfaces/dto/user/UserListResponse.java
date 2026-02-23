package com.smartmall.interfaces.dto.user;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 用户列表响应
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserListResponse {
    
    /** 用户列表 */
    private List<UserDetailResponse> list;
    
    /** 总数 */
    private long total;
}
