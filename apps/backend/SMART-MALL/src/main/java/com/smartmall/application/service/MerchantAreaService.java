package com.smartmall.application.service;

import com.smartmall.common.exception.BusinessException;
import com.smartmall.common.response.ResultCode;
import com.smartmall.domain.entity.Area;
import com.smartmall.domain.enums.AreaStatus;
import com.smartmall.infrastructure.mapper.AreaMapper;
import com.smartmall.infrastructure.mapper.AreaPermissionMapper;
import com.smartmall.infrastructure.service.IntelligenceServiceClient;
import com.smartmall.interfaces.dto.merchant.StoreLayoutResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

/**
 * 商家区域服务
 *
 * 处理商家 AI 布局生成和应用的业务编排
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MerchantAreaService {

    private final AreaMapper areaMapper;
    private final AreaPermissionMapper areaPermissionMapper;
    private final AreaApplyService areaApplyService;
    private final IntelligenceServiceClient intelligenceServiceClient;

    /**
     * AI 生成店铺布局
     *
     * @param areaId     区域 ID
     * @param theme      店铺主题
     * @param merchantId 商家 ID
     * @return 布局响应
     */
    public StoreLayoutResponse generateAILayout(String areaId, String theme, String merchantId) {
        // 1. 校验商家权限
        validatePermission(areaId, merchantId);

        // 2. 校验区域状态为 AUTHORIZED
        Area area = getAreaOrThrow(areaId);
        if (area.getStatus() != AreaStatus.AUTHORIZED) {
            throw new BusinessException(ResultCode.AREA_NOT_AVAILABLE, "该区域当前状态不允许此操作");
        }

        // 3. 获取区域边界信息
        List<Map<String, Object>> boundary = extractBoundary(area);

        // 4. 调用 Intelligence Service 生成布局
        log.info("请求 AI 生成布局: areaId={}, theme={}, merchantId={}", areaId, theme, merchantId);
        return intelligenceServiceClient.generateStoreLayout(theme, areaId, boundary);
    }

    /**
     * 应用 AI 生成的布局
     *
     * @param areaId     区域 ID
     * @param layoutData 布局数据
     * @param merchantId 商家 ID
     */
    @Transactional
    public void applyLayout(String areaId, StoreLayoutResponse.StoreLayoutData layoutData, String merchantId) {
        // 1. 校验商家权限
        validatePermission(areaId, merchantId);

        // 2. 校验区域状态为 AUTHORIZED
        Area area = getAreaOrThrow(areaId);
        if (area.getStatus() != AreaStatus.AUTHORIZED) {
            throw new BusinessException(ResultCode.AREA_NOT_AVAILABLE, "该区域当前状态不允许此操作");
        }

        // 3. TODO: 持久化布局数据（可在后续迭代中扩展存储）
        log.info("应用布局: areaId={}, theme={}, objectCount={}, merchantId={}",
                areaId, layoutData.getTheme(),
                layoutData.getObjects() != null ? layoutData.getObjects().size() : 0,
                merchantId);

        // 4. 更新区域状态为 OCCUPIED
        areaApplyService.confirmLayout(areaId, merchantId);
    }

    /**
     * 校验商家对区域的权限
     */
    private void validatePermission(String areaId, String merchantId) {
        int permCount = areaPermissionMapper.countActiveByAreaAndMerchant(areaId, merchantId);
        if (permCount == 0) {
            throw new BusinessException(ResultCode.AREA_PERMISSION_DENIED);
        }
    }

    /**
     * 获取区域实体，不存在则抛异常
     */
    private Area getAreaOrThrow(String areaId) {
        Area area = areaMapper.selectById(areaId);
        if (area == null || area.getIsDeleted()) {
            throw new BusinessException(ResultCode.AREA_NOT_FOUND);
        }
        return area;
    }

    /**
     * 从区域 shape 字段提取边界顶点
     * <p>
     * shape 字段存储为 JSON，包含 points 数组：[{x, y}, ...]
     */
    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> extractBoundary(Area area) {
        Map<String, Object> shape = area.getShape();
        if (shape == null || !shape.containsKey("points")) {
            log.warn("区域 {} 缺少 shape.points 数据", area.getAreaId());
            return List.of();
        }
        Object points = shape.get("points");
        if (points instanceof List) {
            return (List<Map<String, Object>>) points;
        }
        return List.of();
    }
}
