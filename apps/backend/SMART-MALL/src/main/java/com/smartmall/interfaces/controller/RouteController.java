package com.smartmall.interfaces.controller;

import com.smartmall.application.service.RouteService;
import com.smartmall.common.response.ApiResponse;
import com.smartmall.interfaces.dto.route.RouteDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 路由接口
 * 根据用户角色返回可访问的路由配置
 */
@Tag(name = "路由管理", description = "获取用户可访问的路由配置")
@RestController
@RequestMapping("/user")
@RequiredArgsConstructor
public class RouteController {
    
    private final RouteService routeService;
    
    @Operation(summary = "获取用户路由", description = "根据当前用户角色返回可访问的路由配置")
    @GetMapping("/routes")
    public ApiResponse<List<RouteDTO>> getUserRoutes(Authentication authentication) {
        // 从认证信息中获取用户角色
        String role = authentication.getAuthorities().stream()
            .map(GrantedAuthority::getAuthority)
            .filter(auth -> auth.startsWith("ROLE_"))
            .map(auth -> auth.substring(5)) // 去掉 "ROLE_" 前缀
            .findFirst()
            .orElse("USER");
        
        List<RouteDTO> routes = routeService.getRoutesByRole(role);
        return ApiResponse.success(routes);
    }
}
