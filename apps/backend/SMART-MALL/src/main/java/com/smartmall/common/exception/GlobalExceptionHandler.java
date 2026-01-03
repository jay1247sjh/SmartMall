package com.smartmall.common.exception;

import com.smartmall.common.response.ApiResponse;
import com.smartmall.common.response.ResultCode;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.BindException;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.NoHandlerFoundException;

import java.util.stream.Collectors;

/**
 * 全局异常处理器
 * 
 * 职责：
 * - 统一异常响应格式
 * - 记录异常日志（含请求上下文）
 * - 隐藏敏感的系统错误信息
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {
    
    /**
     * 业务异常
     */
    @ExceptionHandler(BusinessException.class)
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<Void> handleBusinessException(BusinessException e, HttpServletRequest request) {
        log.warn("[业务异常] URI={}, code={}, message={}", 
                request.getRequestURI(), e.getCode(), e.getMessage());
        return ApiResponse.error(e.getCode(), e.getMessage());
    }
    
    /**
     * 参数校验异常 - @Valid
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiResponse<Void> handleValidationException(MethodArgumentNotValidException e, HttpServletRequest request) {
        String message = e.getBindingResult().getFieldErrors().stream()
                .map(this::formatFieldError)
                .collect(Collectors.joining("; "));
        log.warn("[参数校验失败] URI={}, errors={}", request.getRequestURI(), message);
        return ApiResponse.error(ResultCode.PARAM_ERROR, message);
    }
    
    /**
     * 参数绑定异常
     */
    @ExceptionHandler(BindException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiResponse<Void> handleBindException(BindException e, HttpServletRequest request) {
        String message = e.getFieldErrors().stream()
                .map(this::formatFieldError)
                .collect(Collectors.joining("; "));
        log.warn("[参数绑定失败] URI={}, errors={}", request.getRequestURI(), message);
        return ApiResponse.error(ResultCode.PARAM_ERROR, message);
    }
    
    /**
     * 缺少请求参数
     */
    @ExceptionHandler(MissingServletRequestParameterException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiResponse<Void> handleMissingParamException(MissingServletRequestParameterException e, HttpServletRequest request) {
        String message = String.format("缺少必要参数: %s", e.getParameterName());
        log.warn("[缺少参数] URI={}, param={}", request.getRequestURI(), e.getParameterName());
        return ApiResponse.error(ResultCode.PARAM_MISSING, message);
    }
    
    /**
     * 参数类型不匹配
     */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiResponse<Void> handleTypeMismatchException(MethodArgumentTypeMismatchException e, HttpServletRequest request) {
        String message = String.format("参数 '%s' 类型错误", e.getName());
        log.warn("[参数类型错误] URI={}, param={}, value={}", 
                request.getRequestURI(), e.getName(), e.getValue());
        return ApiResponse.error(ResultCode.PARAM_INVALID, message);
    }
    
    /**
     * 请求体解析失败
     */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiResponse<Void> handleMessageNotReadableException(HttpMessageNotReadableException e, HttpServletRequest request) {
        log.warn("[请求体解析失败] URI={}, error={}", request.getRequestURI(), e.getMessage());
        return ApiResponse.error(ResultCode.PARAM_ERROR, "请求体格式错误");
    }
    
    /**
     * 不支持的请求方法
     */
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    @ResponseStatus(HttpStatus.METHOD_NOT_ALLOWED)
    public ApiResponse<Void> handleMethodNotSupportedException(HttpRequestMethodNotSupportedException e, HttpServletRequest request) {
        log.warn("[不支持的请求方法] URI={}, method={}", request.getRequestURI(), e.getMethod());
        return ApiResponse.error(ResultCode.PARAM_ERROR, "不支持的请求方法: " + e.getMethod());
    }
    
    /**
     * 不支持的媒体类型
     */
    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    @ResponseStatus(HttpStatus.UNSUPPORTED_MEDIA_TYPE)
    public ApiResponse<Void> handleMediaTypeNotSupportedException(HttpMediaTypeNotSupportedException e, HttpServletRequest request) {
        log.warn("[不支持的媒体类型] URI={}, contentType={}", request.getRequestURI(), e.getContentType());
        return ApiResponse.error(ResultCode.PARAM_ERROR, "不支持的媒体类型");
    }
    
    /**
     * 资源不存在
     */
    @ExceptionHandler(NoHandlerFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ApiResponse<Void> handleNoHandlerFoundException(NoHandlerFoundException e, HttpServletRequest request) {
        log.warn("[资源不存在] URI={}", request.getRequestURI());
        return ApiResponse.error(ResultCode.NOT_FOUND, "请求的资源不存在");
    }
    
    /**
     * 数据库唯一键冲突
     */
    @ExceptionHandler(DuplicateKeyException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public ApiResponse<Void> handleDuplicateKeyException(DuplicateKeyException e, HttpServletRequest request) {
        log.warn("[数据重复] URI={}, error={}", request.getRequestURI(), e.getMessage());
        return ApiResponse.error(ResultCode.CONFLICT, "数据已存在，请勿重复操作");
    }
    
    /**
     * 数据完整性约束违反
     */
    @ExceptionHandler(DataIntegrityViolationException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public ApiResponse<Void> handleDataIntegrityViolationException(DataIntegrityViolationException e, HttpServletRequest request) {
        log.error("[数据完整性异常] URI={}", request.getRequestURI(), e);
        return ApiResponse.error(ResultCode.CONFLICT, "数据操作冲突，请刷新后重试");
    }
    
    /**
     * 数据库访问异常
     */
    @ExceptionHandler(DataAccessException.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ApiResponse<Void> handleDataAccessException(DataAccessException e, HttpServletRequest request) {
        log.error("[数据库异常] URI={}", request.getRequestURI(), e);
        return ApiResponse.error(ResultCode.DATABASE_ERROR);
    }
    
    /**
     * 其他未知异常
     */
    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ApiResponse<Void> handleException(Exception e, HttpServletRequest request) {
        log.error("[系统异常] URI={}, method={}", request.getRequestURI(), request.getMethod(), e);
        // 生产环境不暴露具体错误信息
        return ApiResponse.error(ResultCode.SYSTEM_ERROR);
    }
    
    /**
     * 格式化字段错误信息
     */
    private String formatFieldError(FieldError error) {
        return String.format("%s: %s", error.getField(), error.getDefaultMessage());
    }
}
