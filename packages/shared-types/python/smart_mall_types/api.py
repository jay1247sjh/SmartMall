"""
API 类型定义

与 TypeScript 版本保持一致
"""

from typing import TypeVar, Generic, List, Optional, Any
from pydantic import BaseModel
from enum import IntEnum
import time


T = TypeVar('T')


class ErrorCode(IntEnum):
    """常用错误码"""
    SUCCESS = 200
    BAD_REQUEST = 400
    UNAUTHORIZED = 401
    FORBIDDEN = 403
    NOT_FOUND = 404
    INTERNAL_ERROR = 500


class ApiResponse(BaseModel, Generic[T]):
    """统一响应结构"""
    code: int
    message: str
    data: Optional[T] = None
    timestamp: Optional[int] = None


class PageRequest(BaseModel):
    """分页请求参数"""
    page: int = 1
    size: int = 10
    sort_by: Optional[str] = None
    sort_order: Optional[str] = "asc"


class PageResponse(BaseModel, Generic[T]):
    """分页响应结构"""
    records: List[T]
    total: int
    page: int
    size: int
    pages: int


SUCCESS_CODE = 200


def create_success_response(data: Any, message: str = "success") -> dict:
    """创建成功响应"""
    return {
        "code": SUCCESS_CODE,
        "message": message,
        "data": data,
        "timestamp": int(time.time() * 1000)
    }


def create_error_response(code: int, message: str) -> dict:
    """创建错误响应"""
    return {
        "code": code,
        "message": message,
        "data": None,
        "timestamp": int(time.time() * 1000)
    }
