package com.smartmall.infrastructure.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.smartmall.domain.entity.Product;
import com.smartmall.domain.enums.ProductStatus;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * 商品 Mapper
 */
@Mapper
public interface ProductMapper extends BaseMapper<Product> {
    
    /**
     * 按店铺ID查询商品列表
     */
    @Select("SELECT * FROM product WHERE store_id = #{storeId} AND is_deleted = false ORDER BY sort_order ASC, created_at DESC")
    List<Product> selectByStoreId(@Param("storeId") String storeId);
    
    /**
     * 按店铺ID和状态查询商品列表
     */
    @Select("SELECT * FROM product WHERE store_id = #{storeId} AND status = #{status} AND is_deleted = false ORDER BY sort_order ASC, created_at DESC")
    List<Product> selectByStoreIdAndStatus(@Param("storeId") String storeId, @Param("status") String status);
    
    /**
     * 按店铺ID分页查询商品
     */
    @Select("<script>" +
            "SELECT * FROM product WHERE store_id = #{storeId} AND is_deleted = false " +
            "<if test='status != null'> AND status = #{status} </if>" +
            "<if test='category != null'> AND category = #{category} </if>" +
            "ORDER BY sort_order ASC, created_at DESC" +
            "</script>")
    IPage<Product> selectPageByStoreId(Page<Product> page, 
                                        @Param("storeId") String storeId,
                                        @Param("status") String status,
                                        @Param("category") String category);
    
    /**
     * 查询公开商品（ON_SALE 和 SOLD_OUT）
     */
    @Select("SELECT * FROM product WHERE store_id = #{storeId} AND status IN ('ON_SALE', 'SOLD_OUT') AND is_deleted = false ORDER BY sort_order ASC, created_at DESC")
    IPage<Product> selectPublicProducts(Page<Product> page, @Param("storeId") String storeId);
    
    /**
     * 统计店铺商品数量
     */
    @Select("SELECT COUNT(*) FROM product WHERE store_id = #{storeId} AND is_deleted = false")
    int countByStoreId(@Param("storeId") String storeId);
    
    /**
     * 统计店铺在售商品数量
     */
    @Select("SELECT COUNT(*) FROM product WHERE store_id = #{storeId} AND status = 'ON_SALE' AND is_deleted = false")
    int countOnSaleByStoreId(@Param("storeId") String storeId);
}
