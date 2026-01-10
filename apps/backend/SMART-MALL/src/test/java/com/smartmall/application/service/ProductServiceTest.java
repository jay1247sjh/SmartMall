package com.smartmall.application.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.smartmall.common.exception.BusinessException;
import com.smartmall.common.response.ResultCode;
import com.smartmall.domain.entity.Product;
import com.smartmall.domain.entity.Store;
import com.smartmall.domain.enums.ProductStatus;
import com.smartmall.domain.enums.StoreStatus;
import com.smartmall.infrastructure.mapper.ProductMapper;
import com.smartmall.infrastructure.mapper.StoreMapper;
import com.smartmall.interfaces.dto.product.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("ProductService 单元测试")
class ProductServiceTest {
    
    @Mock
    private ProductMapper productMapper;
    
    @Mock
    private StoreMapper storeMapper;
    
    @InjectMocks
    private ProductService productService;
    
    private Store activeStore;
    private Store inactiveStore;
    private Product testProduct;
    
    @BeforeEach
    void setUp() {
        // 创建测试店铺
        activeStore = new Store();
        activeStore.setStoreId("store-1");
        activeStore.setMerchantId("merchant-1");
        activeStore.setName("测试店铺");
        activeStore.setStatus(StoreStatus.ACTIVE);
        
        inactiveStore = new Store();
        inactiveStore.setStoreId("store-2");
        inactiveStore.setMerchantId("merchant-1");
        inactiveStore.setName("未激活店铺");
        inactiveStore.setStatus(StoreStatus.PENDING);
        
        // 创建测试商品
        testProduct = new Product();
        testProduct.setProductId("product-1");
        testProduct.setStoreId("store-1");
        testProduct.setName("测试商品");
        testProduct.setPrice(new BigDecimal("99.99"));
        testProduct.setStock(100);
        testProduct.setStatus(ProductStatus.ON_SALE);
    }
    
    @Nested
    @DisplayName("创建商品测试")
    class CreateProductTests {
        
        @Test
        @DisplayName("成功创建商品")
        void createProduct_Success() {
            // Given
            CreateProductRequest request = new CreateProductRequest();
            request.setStoreId("store-1");
            request.setName("新商品");
            request.setPrice(new BigDecimal("199.99"));
            request.setStock(50);
            
            when(storeMapper.selectById("store-1")).thenReturn(activeStore);
            when(productMapper.insert(any(Product.class))).thenReturn(1);
            
            // When
            ProductDTO result = productService.createProduct("merchant-1", request);
            
            // Then
            assertNotNull(result);
            assertEquals("新商品", result.getName());
            assertEquals(ProductStatus.ON_SALE, result.getStatus());
            verify(productMapper).insert(any(Product.class));
        }
        
        @Test
        @DisplayName("库存为0时状态应为SOLD_OUT")
        void createProduct_ZeroStock_SoldOut() {
            // Given
            CreateProductRequest request = new CreateProductRequest();
            request.setStoreId("store-1");
            request.setName("无库存商品");
            request.setPrice(new BigDecimal("99.99"));
            request.setStock(0);
            
            when(storeMapper.selectById("store-1")).thenReturn(activeStore);
            when(productMapper.insert(any(Product.class))).thenReturn(1);
            
            // When
            ProductDTO result = productService.createProduct("merchant-1", request);
            
            // Then
            assertEquals(ProductStatus.SOLD_OUT, result.getStatus());
        }
        
        @Test
        @DisplayName("非店铺所有者创建商品应失败")
        void createProduct_NotOwner_Fail() {
            // Given
            CreateProductRequest request = new CreateProductRequest();
            request.setStoreId("store-1");
            request.setName("新商品");
            request.setPrice(new BigDecimal("99.99"));
            request.setStock(10);
            
            when(storeMapper.selectById("store-1")).thenReturn(activeStore);
            
            // When & Then
            BusinessException exception = assertThrows(BusinessException.class, 
                    () -> productService.createProduct("other-merchant", request));
            assertEquals(ResultCode.STORE_NOT_OWNER.getCode(), exception.getCode());
        }
        
        @Test
        @DisplayName("店铺未激活时创建商品应失败")
        void createProduct_StoreNotActive_Fail() {
            // Given
            CreateProductRequest request = new CreateProductRequest();
            request.setStoreId("store-2");
            request.setName("新商品");
            request.setPrice(new BigDecimal("99.99"));
            request.setStock(10);
            
            when(storeMapper.selectById("store-2")).thenReturn(inactiveStore);
            
            // When & Then
            BusinessException exception = assertThrows(BusinessException.class, 
                    () -> productService.createProduct("merchant-1", request));
            assertEquals(ResultCode.STORE_NOT_ACTIVE.getCode(), exception.getCode());
        }
    }
    
    @Nested
    @DisplayName("更新商品测试")
    class UpdateProductTests {
        
        @Test
        @DisplayName("成功更新商品")
        void updateProduct_Success() {
            // Given
            UpdateProductRequest request = new UpdateProductRequest();
            request.setName("更新后的名称");
            request.setPrice(new BigDecimal("299.99"));
            
            when(productMapper.selectById("product-1")).thenReturn(testProduct);
            when(storeMapper.selectById("store-1")).thenReturn(activeStore);
            when(productMapper.updateById(any(Product.class))).thenReturn(1);
            
            // When
            ProductDTO result = productService.updateProduct("merchant-1", "product-1", request);
            
            // Then
            assertEquals("更新后的名称", result.getName());
            verify(productMapper).updateById(any(Product.class));
        }
        
        @Test
        @DisplayName("非所有者更新商品应失败")
        void updateProduct_NotOwner_Fail() {
            // Given
            UpdateProductRequest request = new UpdateProductRequest();
            request.setName("更新后的名称");
            
            when(productMapper.selectById("product-1")).thenReturn(testProduct);
            when(storeMapper.selectById("store-1")).thenReturn(activeStore);
            
            // When & Then
            BusinessException exception = assertThrows(BusinessException.class, 
                    () -> productService.updateProduct("other-merchant", "product-1", request));
            assertEquals(ResultCode.STORE_NOT_OWNER.getCode(), exception.getCode());
        }
    }
    
    @Nested
    @DisplayName("库存状态同步测试")
    class StockStatusSyncTests {
        
        @Test
        @DisplayName("库存变为0时状态应变为SOLD_OUT")
        void updateStock_ToZero_SoldOut() {
            // Given
            testProduct.setStock(10);
            testProduct.setStatus(ProductStatus.ON_SALE);
            
            when(productMapper.selectById("product-1")).thenReturn(testProduct);
            when(storeMapper.selectById("store-1")).thenReturn(activeStore);
            when(productMapper.updateById(any(Product.class))).thenReturn(1);
            
            // When
            ProductDTO result = productService.updateProductStock("merchant-1", "product-1", 0);
            
            // Then
            assertEquals(0, result.getStock());
            assertEquals(ProductStatus.SOLD_OUT, result.getStatus());
        }
        
        @Test
        @DisplayName("库存从0增加且状态为SOLD_OUT时应恢复为ON_SALE")
        void updateStock_FromZero_OnSale() {
            // Given
            testProduct.setStock(0);
            testProduct.setStatus(ProductStatus.SOLD_OUT);
            
            when(productMapper.selectById("product-1")).thenReturn(testProduct);
            when(storeMapper.selectById("store-1")).thenReturn(activeStore);
            when(productMapper.updateById(any(Product.class))).thenReturn(1);
            
            // When
            ProductDTO result = productService.updateProductStock("merchant-1", "product-1", 50);
            
            // Then
            assertEquals(50, result.getStock());
            assertEquals(ProductStatus.ON_SALE, result.getStatus());
        }
        
        @Test
        @DisplayName("库存从0增加但状态为OFF_SALE时不应改变状态")
        void updateStock_FromZero_OffSale_NoChange() {
            // Given
            testProduct.setStock(0);
            testProduct.setStatus(ProductStatus.OFF_SALE);
            
            when(productMapper.selectById("product-1")).thenReturn(testProduct);
            when(storeMapper.selectById("store-1")).thenReturn(activeStore);
            when(productMapper.updateById(any(Product.class))).thenReturn(1);
            
            // When
            ProductDTO result = productService.updateProductStock("merchant-1", "product-1", 50);
            
            // Then
            assertEquals(50, result.getStock());
            assertEquals(ProductStatus.OFF_SALE, result.getStatus());
        }
    }
    
    @Nested
    @DisplayName("删除商品测试")
    class DeleteProductTests {
        
        @Test
        @DisplayName("成功删除商品")
        void deleteProduct_Success() {
            // Given
            when(productMapper.selectById("product-1")).thenReturn(testProduct);
            when(storeMapper.selectById("store-1")).thenReturn(activeStore);
            when(productMapper.deleteById("product-1")).thenReturn(1);
            
            // When
            productService.deleteProduct("merchant-1", "product-1");
            
            // Then
            verify(productMapper).deleteById("product-1");
        }
        
        @Test
        @DisplayName("非所有者删除商品应失败")
        void deleteProduct_NotOwner_Fail() {
            // Given
            when(productMapper.selectById("product-1")).thenReturn(testProduct);
            when(storeMapper.selectById("store-1")).thenReturn(activeStore);
            
            // When & Then
            BusinessException exception = assertThrows(BusinessException.class, 
                    () -> productService.deleteProduct("other-merchant", "product-1"));
            assertEquals(ResultCode.STORE_NOT_OWNER.getCode(), exception.getCode());
        }
    }
    
    @Nested
    @DisplayName("公开查询测试")
    class PublicQueryTests {
        
        @Test
        @DisplayName("店铺未激活时返回空列表")
        void getPublicProducts_StoreNotActive_Empty() {
            // Given
            when(storeMapper.selectById("store-2")).thenReturn(inactiveStore);
            
            // When
            IPage<ProductDTO> result = productService.getPublicStoreProducts("store-2", 1, 10);
            
            // Then
            assertTrue(result.getRecords().isEmpty());
        }
        
        @Test
        @DisplayName("OFF_SALE商品不应在公开详情中可见")
        void getPublicProduct_OffSale_NotFound() {
            // Given
            testProduct.setStatus(ProductStatus.OFF_SALE);
            when(productMapper.selectById("product-1")).thenReturn(testProduct);
            
            // When & Then
            BusinessException exception = assertThrows(BusinessException.class, 
                    () -> productService.getPublicProduct("product-1"));
            assertEquals(ResultCode.PRODUCT_NOT_FOUND.getCode(), exception.getCode());
        }
    }
}
