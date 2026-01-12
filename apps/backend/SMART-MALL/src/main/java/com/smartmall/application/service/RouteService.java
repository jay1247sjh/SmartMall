package com.smartmall.application.service;

import com.smartmall.interfaces.dto.route.RouteDTO;
import com.smartmall.interfaces.dto.route.RouteDTO.RouteMeta;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

/**
 * 路由服务
 * 根据用户角色返回可访问的路由配置
 */
@Service
@RequiredArgsConstructor
public class RouteService {
    
    /**
     * 根据用户角色获取路由配置
     */
    public List<RouteDTO> getRoutesByRole(String role) {
        List<RouteDTO> routes = new ArrayList<>();
        
        // 公共路由（所有角色可访问）
        routes.addAll(getCommonRoutes());
        
        // 根据角色添加对应路由
        switch (role) {
            case "ADMIN":
                routes.addAll(getAdminRoutes());
                routes.addAll(getMerchantRoutes()); // 管理员也能看商家路由
                routes.addAll(getUserRoutes());
                break;
            case "MERCHANT":
                routes.addAll(getMerchantRoutes());
                routes.addAll(getUserRoutes());
                break;
            case "USER":
                routes.addAll(getUserRoutes());
                break;
        }
        
        return routes;
    }
    
    /**
     * 公共路由
     */
    private List<RouteDTO> getCommonRoutes() {
        return List.of(
            RouteDTO.builder()
                .path("/mall")
                .name("Mall")
                .component("MallView")
                .meta(RouteMeta.builder()
                    .title("商城")
                    .icon("home")
                    .roles(List.of("ADMIN", "MERCHANT", "USER"))
                    .build())
                .build(),
            RouteDTO.builder()
                .path("/mall/3d")
                .name("Mall3D")
                .component("Mall3DView")
                .meta(RouteMeta.builder()
                    .title("3D商城")
                    .icon("view")
                    .roles(List.of("ADMIN", "MERCHANT", "USER"))
                    .build())
                .build(),
            RouteDTO.builder()
                .path("/builder")
                .name("Builder")
                .component("BuilderView")
                .meta(RouteMeta.builder()
                    .title("建模器")
                    .icon("tool")
                    .roles(List.of("ADMIN", "MERCHANT"))
                    .mode("CONFIG")
                    .build())
                .build()
        );
    }
    
    /**
     * 管理员路由
     */
    private List<RouteDTO> getAdminRoutes() {
        List<RouteDTO> routes = new ArrayList<>();
        
        // 管理中心
        routes.add(RouteDTO.builder()
            .path("/admin")
            .name("Admin")
            .component("AdminLayout")
            .redirect("/admin/dashboard")
            .meta(RouteMeta.builder()
                .title("管理中心")
                .icon("setting")
                .roles(List.of("ADMIN"))
                .build())
            .children(List.of(
                RouteDTO.builder()
                    .path("dashboard")
                    .name("AdminDashboard")
                    .component("AdminDashboard")
                    .meta(RouteMeta.builder().title("控制台").icon("dashboard").build())
                    .build(),
                RouteDTO.builder()
                    .path("mall")
                    .name("AdminMallManage")
                    .component("AdminMallManage")
                    .meta(RouteMeta.builder().title("商城管理").icon("shop").build())
                    .build(),
                RouteDTO.builder()
                    .path("area-approval")
                    .name("AdminAreaApproval")
                    .component("AdminAreaApproval")
                    .meta(RouteMeta.builder().title("区域审批").icon("audit").build())
                    .build(),
                RouteDTO.builder()
                    .path("area-permission")
                    .name("AdminAreaPermission")
                    .component("AdminAreaPermission")
                    .meta(RouteMeta.builder().title("权限管理").icon("key").build())
                    .build(),
                RouteDTO.builder()
                    .path("store-manage")
                    .name("AdminStoreManage")
                    .component("AdminStoreManage")
                    .meta(RouteMeta.builder().title("店铺管理").icon("shop").build())
                    .build(),
                RouteDTO.builder()
                    .path("layout-version")
                    .name("AdminLayoutVersion")
                    .component("AdminLayoutVersion")
                    .meta(RouteMeta.builder().title("版本管理").icon("history").build())
                    .build(),
                RouteDTO.builder()
                    .path("users")
                    .name("AdminUserManage")
                    .component("AdminUserManage")
                    .meta(RouteMeta.builder().title("用户管理").icon("user").build())
                    .build()
            ))
            .build());
        
        // 商城建模器（独立全屏路由）
        routes.add(RouteDTO.builder()
            .path("/admin/builder")
            .name("AdminMallBuilder")
            .component("AdminMallBuilder")
            .meta(RouteMeta.builder()
                .title("商城建模")
                .icon("tool")
                .roles(List.of("ADMIN"))
                .build())
            .build());
        
        return routes;
    }
    
    /**
     * 商家路由
     */
    private List<RouteDTO> getMerchantRoutes() {
        return List.of(
            RouteDTO.builder()
                .path("/merchant")
                .name("Merchant")
                .component("MerchantLayout")
                .redirect("/merchant/dashboard")
                .meta(RouteMeta.builder()
                    .title("商家中心")
                    .icon("shop")
                    .roles(List.of("MERCHANT"))
                    .build())
                .children(List.of(
                    RouteDTO.builder()
                        .path("dashboard")
                        .name("MerchantDashboard")
                        .component("MerchantDashboard")
                        .meta(RouteMeta.builder().title("工作台").icon("dashboard").build())
                        .build(),
                    RouteDTO.builder()
                        .path("store-config")
                        .name("MerchantStoreConfig")
                        .component("MerchantStoreConfig")
                        .meta(RouteMeta.builder().title("店铺配置").icon("setting").mode("CONFIG").build())
                        .build(),
                    RouteDTO.builder()
                        .path("area-apply")
                        .name("MerchantAreaApply")
                        .component("MerchantAreaApply")
                        .meta(RouteMeta.builder().title("区域申请").icon("form").build())
                        .build(),
                    RouteDTO.builder()
                        .path("area-permission")
                        .name("MerchantAreaPermission")
                        .component("MerchantAreaPermission")
                        .meta(RouteMeta.builder().title("我的权限").icon("key").build())
                        .build(),
                    RouteDTO.builder()
                        .path("product")
                        .name("MerchantProduct")
                        .component("MerchantProduct")
                        .meta(RouteMeta.builder().title("商品管理").icon("goods").build())
                        .build(),
                    RouteDTO.builder()
                        .path("builder")
                        .name("MerchantBuilder")
                        .component("MerchantBuilder")
                        .meta(RouteMeta.builder().title("建模工具").icon("tool").mode("CONFIG").build())
                        .build()
                ))
                .build()
        );
    }
    
    /**
     * 用户路由
     */
    private List<RouteDTO> getUserRoutes() {
        return List.of(
            RouteDTO.builder()
                .path("/user")
                .name("User")
                .component("Layout")
                .redirect("/user/profile")
                .meta(RouteMeta.builder()
                    .title("个人中心")
                    .icon("user")
                    .roles(List.of("USER", "MERCHANT", "ADMIN"))
                    .build())
                .children(List.of(
                    RouteDTO.builder()
                        .path("profile")
                        .name("UserProfile")
                        .component("UserProfile")
                        .meta(RouteMeta.builder().title("个人信息").icon("user").build())
                        .build()
                ))
                .build()
        );
    }
}
