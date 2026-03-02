package com.smartmall.infrastructure.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.smartmall.domain.entity.LayoutProposal;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * 建模提案 Mapper
 */
@Mapper
public interface LayoutProposalMapper extends BaseMapper<LayoutProposal> {

    /**
     * 查询商家在某区域的活动提案（单条）
     */
    @Select("SELECT * FROM layout_proposal WHERE area_id = #{areaId} AND merchant_id = #{merchantId} AND is_deleted = FALSE LIMIT 1")
    LayoutProposal selectActiveByAreaAndMerchant(@Param("areaId") String areaId, @Param("merchantId") String merchantId);

    /**
     * 查询待审核提案列表
     */
    @Select("SELECT * FROM layout_proposal WHERE status = 'PENDING_REVIEW' AND is_deleted = FALSE ORDER BY updated_at DESC")
    List<LayoutProposal> selectPendingList();
}

