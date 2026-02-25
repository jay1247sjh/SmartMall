package com.smartmall.infrastructure.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.smartmall.domain.entity.ProductReview;
import com.smartmall.interfaces.dto.product.ProductRatingAggregateRow;
import com.smartmall.interfaces.dto.product.ProductReviewQueryRow;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

/**
 * 商品评价 Mapper
 */
@Mapper
public interface ProductReviewMapper extends BaseMapper<ProductReview> {

    /**
     * 查询用户在商品下的评价（未删除）
     */
    @Select("SELECT * FROM product_review WHERE product_id = #{productId} AND user_id = #{userId} AND is_deleted = false LIMIT 1")
    ProductReview selectByProductIdAndUserId(@Param("productId") String productId, @Param("userId") String userId);

    /**
     * 分页查询商品评价与回复
     */
    @Select("<script>" +
            "SELECT " +
            "r.review_id AS review_id, r.product_id AS product_id, r.store_id AS store_id, r.user_id AS user_id, " +
            "u.username AS user_name, r.rating AS rating, r.content AS content, " +
            "r.created_at AS review_created_at, r.updated_at AS review_updated_at, " +
            "rp.reply_id AS reply_id, rp.merchant_id AS merchant_id, mu.username AS merchant_name, " +
            "rp.content AS reply_content, rp.created_at AS reply_created_at, rp.updated_at AS reply_updated_at " +
            "FROM product_review r " +
            "LEFT JOIN \"user\" u ON r.user_id = u.user_id AND u.is_deleted = false " +
            "LEFT JOIN product_review_reply rp ON r.review_id = rp.review_id AND rp.is_deleted = false " +
            "LEFT JOIN \"user\" mu ON rp.merchant_id = mu.user_id AND mu.is_deleted = false " +
            "WHERE r.product_id = #{productId} AND r.is_deleted = false " +
            "ORDER BY r.created_at DESC" +
            "</script>")
    IPage<ProductReviewQueryRow> selectPageByProductId(Page<ProductReviewQueryRow> page, @Param("productId") String productId);

    /**
     * 查询商品评分聚合
     */
    @Select("SELECT COALESCE(ROUND(AVG(rating)::numeric, 2), 0) AS rating_avg, COUNT(*)::int AS rating_count " +
            "FROM product_review WHERE product_id = #{productId} AND is_deleted = false")
    ProductRatingAggregateRow getRatingAggregate(@Param("productId") String productId);

    /**
     * 按星级统计评价数量
     */
    @Select("SELECT COUNT(*) FROM product_review WHERE product_id = #{productId} AND rating = #{rating} AND is_deleted = false")
    long countByProductIdAndRating(@Param("productId") String productId, @Param("rating") Integer rating);
}

