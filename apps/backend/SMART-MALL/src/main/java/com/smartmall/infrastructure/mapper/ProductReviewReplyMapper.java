package com.smartmall.infrastructure.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.smartmall.domain.entity.ProductReviewReply;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

/**
 * 商品评价回复 Mapper
 */
@Mapper
public interface ProductReviewReplyMapper extends BaseMapper<ProductReviewReply> {

    /**
     * 根据评价ID查询回复
     */
    @Select("SELECT * FROM product_review_reply WHERE review_id = #{reviewId} AND is_deleted = false LIMIT 1")
    ProductReviewReply selectByReviewId(@Param("reviewId") String reviewId);
}

