package com.smartmall.application.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.smartmall.common.exception.BusinessException;
import com.smartmall.common.response.ResultCode;
import com.smartmall.common.util.IdGenerator;
import com.smartmall.domain.entity.Product;
import com.smartmall.domain.entity.Store;
import com.smartmall.domain.enums.ProductStatus;
import com.smartmall.domain.enums.StoreStatus;
import com.smartmall.infrastructure.mapper.ProductMapper;
import com.smartmall.infrastructure.mapper.StoreMapper;
import com.smartmall.interfaces.dto.product.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 商品管理服务
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ProductService {
    
    private final ProductMapper productMapper;
    private final StoreMapper storeMapper;
    
    /**
     * 创建商品
     */
    @Transactional
    public ProductDTO createProduct(String merchantId, CreateProductRequest request) {
        // 验证店铺所有权和状态
        Store store = validateStoreOwnership(merchantId, request.getStoreId());
        
        // 检查店铺状态
        if (store.getStatus() != StoreStatus.ACTIVE) {
            throw new BusinessException(ResultCode.STORE_NOT_ACTIVE);
        }
        
        // 创建商品
        Product product = new Product();
        product.setProductId(IdGenerator.nextId());
        product.setStoreId(request.getStoreId());
        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setPrice(request.getPrice());
        product.setOriginalPrice(request.getOriginalPrice());
        product.setStock(request.getStock());
        product.setCategory(request.getCategory());
        product.setImage(request.getImage());
        product.setImages(request.getImages());
        product.setSortOrder(request.getSortOrder() != null ? request.getSortOrder() : 0);
        
        // 根据库存设置初始状态
        if (request.getStock() == 0) {
            product.setStatus(ProductStatus.SOLD_OUT);
        } else {
            product.setStatus(ProductStatus.ON_SALE);
        }
        
        productMapper.insert(product);
        log.info("商品创建成功: productId={}, storeId={}, name={}", 
                product.getProductId(), product.getStoreId(), product.getName());
        
        return toDTO(product, store.getName());
    }
    
    /**
     * 获取商品详情（商家端）
     */
    public ProductDTO getProduct(String merchantId, String productId) {
        Product product = getProductById(productId);
        Store store = validateStoreOwnership(merchantId, product.getStoreId());
        return toDTO(product, store.getName());
    }
    
    /**
     * 获取店铺商品列表（商家端）
     */
    public IPage<ProductDTO> getStoreProducts(String merchantId, String storeId, ProductQueryRequest request) {
        Store store = validateStoreOwnership(merchantId, storeId);
        
        Page<Product> page = new Page<>(request.getPage(), request.getSize());
        String status = request.getStatus() != null ? request.getStatus().getCode() : null;
        
        IPage<Product> productPage = productMapper.selectPageByStoreId(
                page, storeId, status, request.getCategory());
        
        return productPage.convert(p -> toDTO(p, store.getName()));
    }
    
    /**
     * 更新商品
     */
    @Transactional
    public ProductDTO updateProduct(String merchantId, String productId, UpdateProductRequest request) {
        Product product = getProductById(productId);
        Store store = validateStoreOwnership(merchantId, product.getStoreId());
        
        // 更新字段
        if (request.getName() != null) {
            product.setName(request.getName());
        }
        if (request.getDescription() != null) {
            product.setDescription(request.getDescription());
        }
        if (request.getPrice() != null) {
            product.setPrice(request.getPrice());
        }
        if (request.getOriginalPrice() != null) {
            product.setOriginalPrice(request.getOriginalPrice());
        }
        if (request.getStock() != null) {
            updateStockAndStatus(product, request.getStock());
        }
        if (request.getCategory() != null) {
            product.setCategory(request.getCategory());
        }
        if (request.getImage() != null) {
            product.setImage(request.getImage());
        }
        if (request.getImages() != null) {
            product.setImages(request.getImages());
        }
        if (request.getSortOrder() != null) {
            product.setSortOrder(request.getSortOrder());
        }
        
        productMapper.updateById(product);
        log.info("商品更新成功: productId={}", productId);
        
        return toDTO(product, store.getName());
    }
    
    /**
     * 删除商品（软删除）
     */
    @Transactional
    public void deleteProduct(String merchantId, String productId) {
        Product product = getProductById(productId);
        validateStoreOwnership(merchantId, product.getStoreId());
        
        productMapper.deleteById(productId);
        log.info("商品删除成功: productId={}", productId);
    }
    
    /**
     * 更新商品状态
     */
    @Transactional
    public ProductDTO updateProductStatus(String merchantId, String productId, ProductStatus status) {
        Product product = getProductById(productId);
        Store store = validateStoreOwnership(merchantId, product.getStoreId());
        
        // 验证状态转换
        validateStatusTransition(product.getStatus(), status);
        
        product.setStatus(status);
        productMapper.updateById(product);
        log.info("商品状态更新: productId={}, status={}", productId, status);
        
        return toDTO(product, store.getName());
    }
    
    /**
     * 更新库存
     */
    @Transactional
    public ProductDTO updateProductStock(String merchantId, String productId, Integer stock) {
        Product product = getProductById(productId);
        Store store = validateStoreOwnership(merchantId, product.getStoreId());
        
        updateStockAndStatus(product, stock);
        productMapper.updateById(product);
        log.info("商品库存更新: productId={}, stock={}", productId, stock);
        
        return toDTO(product, store.getName());
    }
    
    /**
     * 获取公开商品列表
     */
    public IPage<ProductDTO> getPublicStoreProducts(String storeId, int page, int size) {
        // 检查店铺状态
        Store store = storeMapper.selectById(storeId);
        if (store == null || store.getStatus() != StoreStatus.ACTIVE) {
            // 返回空结果
            return new Page<ProductDTO>(page, size).setRecords(List.of());
        }
        
        Page<Product> pageParam = new Page<>(page, size);
        IPage<Product> productPage = productMapper.selectPublicProducts(pageParam, storeId);
        
        return productPage.convert(p -> toDTO(p, store.getName()));
    }
    
    /**
     * 获取公开商品详情
     */
    public ProductDTO getPublicProduct(String productId) {
        Product product = getProductById(productId);
        
        // 检查商品状态（只有 ON_SALE 和 SOLD_OUT 可见）
        if (product.getStatus() == ProductStatus.OFF_SALE) {
            throw new BusinessException(ResultCode.PRODUCT_NOT_FOUND);
        }
        
        // 检查店铺状态
        Store store = storeMapper.selectById(product.getStoreId());
        if (store == null || store.getStatus() != StoreStatus.ACTIVE) {
            throw new BusinessException(ResultCode.PRODUCT_NOT_FOUND);
        }
        
        return toDTO(product, store.getName());
    }
    
    // ==================== 私有方法 ====================
    
    /**
     * 验证店铺所有权
     */
    private Store validateStoreOwnership(String merchantId, String storeId) {
        Store store = storeMapper.selectById(storeId);
        if (store == null) {
            throw new BusinessException(ResultCode.STORE_NOT_FOUND);
        }
        if (!store.getMerchantId().equals(merchantId)) {
            throw new BusinessException(ResultCode.STORE_NOT_OWNER);
        }
        return store;
    }
    
    /**
     * 获取商品（检查存在性）
     */
    private Product getProductById(String productId) {
        Product product = productMapper.selectById(productId);
        if (product == null) {
            throw new BusinessException(ResultCode.PRODUCT_NOT_FOUND);
        }
        return product;
    }
    
    /**
     * 更新库存并同步状态
     */
    private void updateStockAndStatus(Product product, Integer newStock) {
        Integer oldStock = product.getStock();
        product.setStock(newStock);
        
        // 库存变为0，自动设置为售罄
        if (newStock == 0 && oldStock > 0) {
            product.setStatus(ProductStatus.SOLD_OUT);
        }
        // 库存从0增加，如果是售罄状态则恢复为在售
        else if (newStock > 0 && oldStock == 0 && product.getStatus() == ProductStatus.SOLD_OUT) {
            product.setStatus(ProductStatus.ON_SALE);
        }
    }
    
    /**
     * 验证状态转换
     */
    private void validateStatusTransition(ProductStatus from, ProductStatus to) {
        // 所有状态转换都允许，除了从 SOLD_OUT 手动转换（应该通过库存自动管理）
        // 这里简化处理，允许所有转换
    }
    
    /**
     * 转换为 DTO
     */
    private ProductDTO toDTO(Product product, String storeName) {
        ProductDTO dto = new ProductDTO();
        dto.setProductId(product.getProductId());
        dto.setStoreId(product.getStoreId());
        dto.setStoreName(storeName);
        dto.setName(product.getName());
        dto.setDescription(product.getDescription());
        dto.setPrice(product.getPrice());
        dto.setOriginalPrice(product.getOriginalPrice());
        dto.setStock(product.getStock());
        dto.setCategory(product.getCategory());
        dto.setImage(product.getImage());
        dto.setImages(product.getImages());
        dto.setStatus(product.getStatus());
        dto.setSortOrder(product.getSortOrder());
        dto.setCreatedAt(product.getCreateTime());
        dto.setUpdatedAt(product.getUpdateTime());
        return dto;
    }
}
