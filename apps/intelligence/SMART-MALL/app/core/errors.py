"""
共享错误处理模块

提供统一的 LLM 错误解析和用户友好消息转换
"""

from typing import Tuple, List


class LLMErrorParser:
    """
    LLM 错误解析器
    
    解析 LLM 调用错误，返回结构化的错误信息，包括：
    - HTTP 状态码
    - 错误类型标识
    - 用户友好的中文消息
    """
    
    # 错误模式映射表
    # 格式: (匹配关键词列表, HTTP状态码, 错误类型, 用户消息)
    ERROR_PATTERNS: List[Tuple[List[str], int, str, str]] = [
        (
            ['invalid_api_key', '401'],
            401,
            'api_key_error',
            'AI 服务配置异常，请联系管理员检查 API 密钥配置'
        ),
        (
            ['rate_limit', '429'],
            429,
            'rate_limit',
            'AI 服务请求过于频繁，请稍后再试'
        ),
        (
            ['insufficient_quota', 'billing'],
            402,
            'quota_exceeded',
            'AI 服务配额不足，请联系管理员'
        ),
        (
            ['model_not_found', 'does not exist'],
            404,
            'model_not_found',
            'AI 模型配置错误，请联系管理员'
        ),
        (
            ['timeout', 'timed out'],
            504,
            'timeout',
            'AI 服务响应超时，请稍后重试'
        ),
        (
            ['connection', 'network'],
            503,
            'connection_error',
            'AI 服务连接失败，请检查网络或稍后重试'
        ),
    ]
    
    # 默认错误响应
    DEFAULT_ERROR: Tuple[int, str, str] = (
        500,
        'internal_error',
        '服务处理异常，请稍后重试'
    )
    
    @classmethod
    def parse(cls, error: Exception) -> Tuple[int, str, str]:
        """
        解析 LLM 错误
        
        Args:
            error: 异常对象
            
        Returns:
            Tuple[int, str, str]: (HTTP状态码, 错误类型, 用户友好消息)
        """
        error_str = str(error).lower()
        
        for patterns, status_code, error_type, message in cls.ERROR_PATTERNS:
            if any(pattern.lower() in error_str for pattern in patterns):
                return status_code, error_type, message
        
        return cls.DEFAULT_ERROR


def parse_llm_error(error: Exception) -> Tuple[int, str, str]:
    """
    解析 LLM 调用错误的便捷函数
    
    Args:
        error: 异常对象
        
    Returns:
        Tuple[int, str, str]: (HTTP状态码, 错误类型, 用户友好消息)
        
    Example:
        >>> try:
        ...     await llm.chat(messages)
        ... except Exception as e:
        ...     status_code, error_type, message = parse_llm_error(e)
        ...     return ErrorResponse(status_code=status_code, error_type=error_type, message=message)
    """
    return LLMErrorParser.parse(error)


# 错误类型常量，便于类型检查和引用
class ErrorTypes:
    """错误类型常量"""
    API_KEY_ERROR = 'api_key_error'
    RATE_LIMIT = 'rate_limit'
    QUOTA_EXCEEDED = 'quota_exceeded'
    MODEL_NOT_FOUND = 'model_not_found'
    TIMEOUT = 'timeout'
    CONNECTION_ERROR = 'connection_error'
    INTERNAL_ERROR = 'internal_error'
