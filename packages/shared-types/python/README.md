# Smart Mall 共享类型 (Python)

这个包包含 Smart Mall 项目的共享类型定义，用于 AI 服务。

## 安装

```bash
pip install -e packages/shared-types/python
```

## 使用

```python
from smart_mall_types import (
    UserRole, AreaType, StoreStatus, ProductStatus,
    AREA_TYPE_NAMES, AREA_TYPE_COLORS,
    Point2D, Polygon, calculate_polygon_area,
    ApiResponse, create_success_response
)

# 使用枚举
role = UserRole.ADMIN
area_type = AreaType.RETAIL

# 获取显示名称
print(AREA_TYPE_NAMES[area_type])  # 零售店铺

# 使用几何类型
polygon = Polygon(
    vertices=[
        Point2D(x=0, y=0),
        Point2D(x=10, y=0),
        Point2D(x=10, y=10),
        Point2D(x=0, y=10),
    ],
    is_closed=True
)
area = calculate_polygon_area(polygon.vertices)
print(f"面积: {area}")  # 100

# 创建 API 响应
response = create_success_response({"id": "123"})
```
