package com.smartmall.common.response;

import lombok.Getter;

/**
 * 错误码枚举
 * 前缀说明：
 * - 0: 成功
 * - A: 客户端参数/业务错误
 * - B: 系统内部错误
 * - C: 外部依赖错误
 */
@Getter
public enum ResultCode {
    
    // 成功
    SUCCESS("0", "OK"),

    // A - 客户端参数/业务错误
    PARAM_ERROR("A1001", "参数校验失败"),
    PARAM_MISSING("A1002", "缺少必要参数"),
    PARAM_INVALID("A1003", "参数格式错误"),
    
    AUTH_FAILED("A2001", "认证失败"),
    AUTH_TOKEN_EXPIRED("A2002", "Token已过期"),
    AUTH_TOKEN_INVALID("A2003", "Token无效"),
    AUTH_REFRESH_TOKEN_EXPIRED("A2004", "RefreshToken已过期"),
    
    PERMISSION_DENIED("A3001", "权限不足"),
    AREA_PERMISSION_DENIED("A3002", "未获得该区域的建模权限"),
    
    USER_NOT_FOUND("A4001", "用户不存在"),
    USER_ALREADY_EXISTS("A4002", "用户已存在"),
    USER_FROZEN("A4003", "用户已被冻结"),
    PASSWORD_ERROR("A4004", "密码错误"),
    
    MALL_NOT_FOUND("A5001", "商城不存在"),
    FLOOR_NOT_FOUND("A5002", "楼层不存在"),
    AREA_NOT_FOUND("A5003", "区域不存在"),
    STORE_NOT_FOUND("A5004", "店铺不存在"),
    PRODUCT_NOT_FOUND("A5005", "商品不存在"),
    
    AREA_NOT_AVAILABLE("A6001", "区域不可申请"),
    AREA_ALREADY_APPLIED("A6002", "已提交过申请"),
    APPLY_NOT_FOUND("A6003", "申请不存在"),
    APPLY_ALREADY_PROCESSED("A6004", "申请已处理"),

    // B - 系统内部错误
    SYSTEM_ERROR("B1001", "系统内部错误"),
    DATABASE_ERROR("B1002", "数据库异常"),
    CACHE_ERROR("B1003", "缓存异常"),

    // C - 外部依赖错误
    EXTERNAL_SERVICE_ERROR("C1001", "外部服务异常"),
    EXTERNAL_SERVICE_TIMEOUT("C1002", "外部服务超时");

    private final String code;
    private final String message;

    ResultCode(String code, String message) {
        this.code = code;
        this.message = message;
    }
}
