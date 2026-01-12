package com.smartmall.interfaces.dto.route;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * 路由配置 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RouteDTO {
    
    /**
     * 路由路径
     */
    private String path;
    
    /**
     * 路由名称
     */
    private String name;
    
    /**
     * 组件标识符（前端组件映射）
     */
    private String component;
    
    /**
     * 重定向路径
     */
    private String redirect;
    
    /**
     * 路由元信息
     */
    private RouteMeta meta;
    
    /**
     * 子路由
     */
    private List<RouteDTO> children;
    
    /**
     * 路由元信息
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RouteMeta {
        /**
         * 页面标题
         */
        private String title;
        
        /**
         * 菜单图标
         */
        private String icon;
        
        /**
         * 允许访问的角色
         */
        private List<String> roles;
        
        /**
         * 系统模式（CONFIG/VIEW）
         */
        private String mode;
    }
}
