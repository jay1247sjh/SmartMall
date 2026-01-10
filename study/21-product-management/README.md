# 商品管理学习指南

## 学习目标

通过本章学习，你将掌握：
- 商品管理的完整业务流程
- 商品状态与库存管理
- 前后端商品 API 对接
- 公开接口与私有接口的区分

---

## 苏格拉底式问答

### 问题 1：商品有哪些状态？库存与状态有什么关系？

**思考**：商品的上架、下架、售罄是如何管理的？

<details>
<summary>点击查看答案</summary>

商品状态枚举（`ProductStatus`）：

| 状态 | 说明 | 触发条件 |
|------|------|----------|
| ON_SALE | 在售 | 商家上架，库存 > 0 |
| OFF_SALE | 下架 | 商家主动下架 |
| SOLD_OUT | 售罄 | 库存 = 0 时自动设置 |

库存与状态的联动规则：
```java
// ProductService.java
public void updateStock(Long productId, Integer stock) {
    Product product = getProductById(productId);
    product.setStock(stock);
    
    // 库存为0时自动设置为售罄
    if (stock == 0 && product.getStatus() == ProductStatus.ON_SALE) {
        product.setStatus(ProductStatus.SOLD_OUT);
    }
    
    // 库存从0增加时，如果是售罄状态，自动恢复为在售
    if (stock > 0 && product.getStatus() == ProductStatus.SOLD_OUT) {
        product.setStatus(ProductStatus.ON_SALE);
    }
    
    productMapper.updateById(product);
}
```

</details>

### 问题 2：为什么要区分公开接口和私有接口？

**思考**：顾客浏览商品和商家管理商品，需要的数据一样吗？

<details>
<summary>点击查看答案</summary>

**公开接口**（`PublicProductController`）：
- 无需登录即可访问
- 只返回在售/售罄商品
- 只返回营业中店铺的商品
- 不返回敏感信息（如成本价）

```java
// PublicProductController.java
@GetMapping("/public/store/{storeId}/products")
public ApiResponse<List<ProductDTO>> getStoreProducts(
        @PathVariable Long storeId) {
    // 只返回 ON_SALE 和 SOLD_OUT 状态的商品
    // 非 ACTIVE 店铺返回空列表
    return ApiResponse.success(
        productService.getPublicStoreProducts(storeId));
}
```

**私有接口**（`ProductController`）：
- 需要登录且验证所有权
- 返回所有状态的商品
- 返回完整信息
- 支持增删改操作

```java
// ProductController.java
@GetMapping("/product/store/{storeId}")
public ApiResponse<PageResult<ProductDTO>> getStoreProducts(
        @PathVariable Long storeId,
        ProductQueryRequest request) {
    // 验证店铺所有权
    Long userId = getCurrentUserId();
    // 返回所有商品（包括下架的）
    return ApiResponse.success(
        productService.getStoreProducts(userId, storeId, request));
}
```

</details>

### 问题 3：创建商品需要什么前置条件？

**思考**：商家能在任何店铺创建商品吗？

<details>
<summary>点击查看答案</summary>

创建商品的前置条件：

1. **店铺所有权**：商家必须是该店铺的所有者
2. **店铺状态**：店铺必须是 `ACTIVE` 状态
3. **必填字段**：商品名称、价格、库存

```java
// ProductService.java
public ProductDTO createProduct(Long userId, CreateProductRequest request) {
    // 1. 验证店铺所有权
    Store store = storeMapper.selectById(request.getStoreId());
    if (store == null || !store.getOwnerId().equals(userId)) {
        throw new BusinessException(ResultCode.STORE_NOT_OWNER);
    }
    
    // 2. 验证店铺状态
    if (store.getStatus() != StoreStatus.ACTIVE) {
        throw new BusinessException(ResultCode.STORE_NOT_ACTIVE);
    }
    
    // 3. 创建商品
    Product product = new Product();
    product.setStoreId(request.getStoreId());
    product.setName(request.getName());
    product.setPrice(request.getPrice());
    product.setStock(request.getStock());
    product.setStatus(ProductStatus.ON_SALE);
    // ...
}
```

</details>

---

## 核心代码解析

### 1. 后端实体设计

```java
// domain/entity/Product.java
@Data
@TableName("product")
public class Product {
    @TableId(type = IdType.AUTO)
    private Long id;
    
    private Long storeId;      // 所属店铺ID
    private String name;       // 商品名称
    private String description;// 商品描述
    private BigDecimal price;  // 商品价格
    private Integer stock;     // 库存数量
    private String category;   // 商品分类
    private String images;     // 商品图片（JSON数组）
    
    @EnumValue
    private ProductStatus status;// 商品状态
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
```

### 2. 前端 API 封装

```typescript
// api/product.api.ts
import { http } from './http'

// 商家端 API
export const productApi = {
  // 创建商品
  createProduct: (data: CreateProductRequest) =>
    http.post<ProductDTO>('/api/product', data),
  
  // 获取店铺商品列表
  getStoreProducts: (storeId: number, params?: ProductQueryRequest) =>
    http.get<PageResult<ProductDTO>>(`/api/product/store/${storeId}`, { params }),
  
  // 更新商品状态（上架/下架）
  updateProductStatus: (productId: number, status: ProductStatus) =>
    http.post<void>(`/api/product/${productId}/status`, { status }),
  
  // 更新库存
  updateProductStock: (productId: number, stock: number) =>
    http.post<void>(`/api/product/${productId}/stock`, { stock }),
}

// 公开 API（无需登录）
export const publicProductApi = {
  // 获取店铺公开商品
  getStoreProducts: (storeId: number) =>
    http.get<ProductDTO[]>(`/api/public/store/${storeId}/products`),
  
  // 获取商品详情
  getProduct: (productId: number) =>
    http.get<ProductDTO>(`/api/public/product/${productId}`),
}
```

### 3. 商品状态管理

```typescript
// ProductManageView.vue
const handleStatusChange = async (product: Product) => {
  try {
    const newStatus = product.status === 'ON_SALE' ? 'OFF_SALE' : 'ON_SALE'
    await productApi.updateProductStatus(product.id, newStatus)
    ElMessage.success(newStatus === 'ON_SALE' ? '商品已上架' : '商品已下架')
    loadProducts()
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

const handleStockEdit = async (product: Product, newStock: number) => {
  try {
    await productApi.updateProductStock(product.id, newStock)
    ElMessage.success('库存已更新')
    loadProducts()
  } catch (error) {
    ElMessage.error('更新失败')
  }
}
```

---

## API 接口一览

### 商家端接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/product` | 创建商品 |
| GET | `/api/product/{id}` | 获取商品详情 |
| PUT | `/api/product/{id}` | 更新商品 |
| DELETE | `/api/product/{id}` | 删除商品 |
| GET | `/api/product/store/{storeId}` | 获取店铺商品列表 |
| POST | `/api/product/{id}/status` | 更新商品状态 |
| POST | `/api/product/{id}/stock` | 更新库存 |

### 公开接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/public/store/{storeId}/products` | 获取店铺公开商品 |
| GET | `/api/public/product/{id}` | 获取商品公开详情 |

---

## 实践练习

### 练习 1：追踪商品上架的完整流程

从前端点击"上架"按钮开始，追踪到数据库更新：

```
ProductManageView.vue: handleStatusChange()
    ↓
product.api.ts: productApi.updateProductStatus()
    ↓
ProductController.updateStatus()
    ↓
ProductService.updateProductStatus()
    ↓
ProductMapper.updateById()
```

### 练习 2：实现商品搜索功能

假设要添加按名称搜索商品的功能，需要修改哪些文件？

<details>
<summary>点击查看答案</summary>

1. **后端**：
   - `ProductQueryRequest.java` - 添加 `keyword` 字段
   - `ProductService.java` - 添加模糊查询逻辑

2. **前端**：
   - `ProductManageView.vue` - 添加搜索输入框
   - 调用 API 时传递 `keyword` 参数

</details>

### 练习 3：理解库存自动状态变更

当库存从 5 变为 0 时，商品状态会如何变化？

<details>
<summary>点击查看答案</summary>

```java
// 库存更新逻辑
if (stock == 0 && product.getStatus() == ProductStatus.ON_SALE) {
    product.setStatus(ProductStatus.SOLD_OUT);
}
```

结果：商品状态从 `ON_SALE` 自动变为 `SOLD_OUT`

反向：当库存从 0 变为 10 时，如果状态是 `SOLD_OUT`，会自动恢复为 `ON_SALE`

</details>

---

## 关键文件

### 后端文件

| 文件 | 说明 |
|------|------|
| [Product.java](../../apps/backend/SMART-MALL/src/main/java/com/smartmall/domain/entity/Product.java) | 商品实体 |
| [ProductStatus.java](../../apps/backend/SMART-MALL/src/main/java/com/smartmall/domain/enums/ProductStatus.java) | 商品状态枚举 |
| [ProductService.java](../../apps/backend/SMART-MALL/src/main/java/com/smartmall/application/service/ProductService.java) | 商品服务 |
| [ProductController.java](../../apps/backend/SMART-MALL/src/main/java/com/smartmall/interfaces/controller/ProductController.java) | 商家端控制器 |
| [PublicProductController.java](../../apps/backend/SMART-MALL/src/main/java/com/smartmall/interfaces/controller/PublicProductController.java) | 公开接口控制器 |
| [ProductMapper.java](../../apps/backend/SMART-MALL/src/main/java/com/smartmall/infrastructure/mapper/ProductMapper.java) | 数据访问层 |

### 前端文件

| 文件 | 说明 |
|------|------|
| [product.api.ts](../../apps/frontend/SMART-MALL/src/api/product.api.ts) | 商品 API |
| [ProductManageView.vue](../../apps/frontend/SMART-MALL/src/views/merchant/ProductManageView.vue) | 商品管理页面 |

---

## 延伸阅读

- [电商系统商品设计](https://www.infoq.cn/article/e-commerce-product-design)
- [库存管理最佳实践](https://www.shopify.com/blog/inventory-management)
- [RESTful API 版本控制](https://restfulapi.net/versioning/)
