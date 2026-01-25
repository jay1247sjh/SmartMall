"""
基础响应模型

提供统一的 API 响应模型基类，确保响应格式一致性
"""

from typing import Optional, Generic, TypeVar, List
from pydantic import BaseModel, Field
from datetime import datetime

T = TypeVar('T')


class BaseResponse(BaseModel):
    """
    基础响应模型
    
    所有 API 响应的基类，包含通用字段
    """
    success: bool = True
    message: Optional[str] = None
    timestamp: str = Field(
        default_factory=lambda: datetime.utcnow().isoformat() + "Z"
    )


class DataResponse(BaseResponse, Generic[T]):
    """
    数据响应模型
    
    用于返回单个数据对象的响应
    """
    data: Optional[T] = None


class ErrorResponse(BaseModel):
    """
    错误响应模型
    
    用于返回错误信息的响应
    """
    success: bool = False
    error_type: str
    message: str
    timestamp: str = Field(
        default_factory=lambda: datetime.utcnow().isoformat() + "Z"
    )
    
    @classmethod
    def from_error(cls, error_type: str, message: str) -> "ErrorResponse":
        """
        从错误信息创建错误响应
        
        Args:
            error_type: 错误类型标识
            message: 用户友好的错误消息
            
        Returns:
            ErrorResponse 实例
        """
        return cls(error_type=error_type, message=message)
    
    @classmethod
    def from_parsed_error(
        cls,
        parsed_error: tuple[int, str, str]
    ) -> "ErrorResponse":
        """
        从解析后的错误元组创建错误响应
        
        Args:
            parsed_error: (status_code, error_type, message) 元组
            
        Returns:
            ErrorResponse 实例
        """
        _, error_type, message = parsed_error
        return cls(error_type=error_type, message=message)


class PaginatedResponse(BaseResponse, Generic[T]):
    """
    分页响应模型
    
    用于返回分页数据的响应
    """
    data: List[T] = []
    total: int = 0
    page: int = 1
    size: int = 10
    
    @property
    def total_pages(self) -> int:
        """计算总页数"""
        if self.size <= 0:
            return 0
        return (self.total + self.size - 1) // self.size
    
    @property
    def has_next(self) -> bool:
        """是否有下一页"""
        return self.page < self.total_pages
    
    @property
    def has_prev(self) -> bool:
        """是否有上一页"""
        return self.page > 1


class ListResponse(BaseResponse, Generic[T]):
    """
    列表响应模型
    
    用于返回列表数据的响应（不分页）
    """
    data: List[T] = []
    total: int = 0
