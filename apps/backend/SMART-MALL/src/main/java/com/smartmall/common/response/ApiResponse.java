package com.smartmall.common.response;

import lombok.Data;
import java.io.Serial;
import java.io.Serializable;

/**
 * 统一响应结构
 * 
 * 所有 API 响应都使用此结构，确保前后端契约一致
 */
@Data
public class ApiResponse<T> implements Serializable {
    
    @Serial
    private static final long serialVersionUID = 1L;
    
    /** 响应码，"0" 表示成功 */
    private String code;
    
    /** 响应消息 */
    private String message;
    
    /** 响应数据 */
    private T data;
    
    /** 响应时间戳（毫秒） */
    private Long timestamp;

    private ApiResponse() {
        this.timestamp = System.currentTimeMillis();
    }

    /**
     * 成功响应（无数据）
     */
    public static <T> ApiResponse<T> success() {
        return success(null);
    }

    /**
     * 成功响应（带数据）
     */
    public static <T> ApiResponse<T> success(T data) {
        ApiResponse<T> response = new ApiResponse<>();
        response.setCode(ResultCode.SUCCESS.getCode());
        response.setMessage(ResultCode.SUCCESS.getMessage());
        response.setData(data);
        return response;
    }

    /**
     * 成功响应（自定义消息）
     */
    public static <T> ApiResponse<T> success(String message, T data) {
        ApiResponse<T> response = new ApiResponse<>();
        response.setCode(ResultCode.SUCCESS.getCode());
        response.setMessage(message);
        response.setData(data);
        return response;
    }

    /**
     * 错误响应（自定义 code 和 message）
     */
    public static <T> ApiResponse<T> error(String code, String message) {
        ApiResponse<T> response = new ApiResponse<>();
        response.setCode(code);
        response.setMessage(message);
        return response;
    }

    /**
     * 错误响应（使用 ResultCode）
     */
    public static <T> ApiResponse<T> error(ResultCode resultCode) {
        return error(resultCode.getCode(), resultCode.getMessage());
    }

    /**
     * 错误响应（使用 ResultCode + 自定义消息）
     */
    public static <T> ApiResponse<T> error(ResultCode resultCode, String message) {
        return error(resultCode.getCode(), message);
    }
    
    /**
     * 判断是否成功
     */
    public boolean isSuccess() {
        return ResultCode.SUCCESS.getCode().equals(this.code);
    }
}
