"""
模型定义

与 TypeScript 版本保持一致
"""

from typing import List
from pydantic import BaseModel
import math


class Point2D(BaseModel):
    """2D 点"""
    x: float
    y: float


class Point3D(BaseModel):
    """3D 点/向量"""
    x: float
    y: float
    z: float


class Polygon(BaseModel):
    """多边形"""
    vertices: List[Point2D]
    is_closed: bool = True


class Rectangle(BaseModel):
    """矩形"""
    x: float
    y: float
    width: float
    height: float


class BoundingBox(BaseModel):
    """边界盒"""
    min: Point3D
    max: Point3D


class Transform2D(BaseModel):
    """2D 变换"""
    x: float = 0
    y: float = 0
    scale: float = 1
    rotation: float = 0


def calculate_polygon_area(vertices: List[Point2D]) -> float:
    """计算多边形面积"""
    if len(vertices) < 3:
        return 0
    
    area = 0
    n = len(vertices)
    for i in range(n):
        j = (i + 1) % n
        area += vertices[i].x * vertices[j].y
        area -= vertices[j].x * vertices[i].y
    
    return abs(area / 2)


def calculate_polygon_perimeter(vertices: List[Point2D]) -> float:
    """计算多边形周长"""
    if len(vertices) < 2:
        return 0
    
    perimeter = 0
    n = len(vertices)
    for i in range(n):
        j = (i + 1) % n
        dx = vertices[j].x - vertices[i].x
        dy = vertices[j].y - vertices[i].y
        perimeter += math.sqrt(dx * dx + dy * dy)
    
    return perimeter


def calculate_polygon_center(vertices: List[Point2D]) -> Point2D:
    """计算多边形中心点"""
    if len(vertices) == 0:
        return Point2D(x=0, y=0)
    
    sum_x = sum(v.x for v in vertices)
    sum_y = sum(v.y for v in vertices)
    n = len(vertices)
    
    return Point2D(x=sum_x / n, y=sum_y / n)
