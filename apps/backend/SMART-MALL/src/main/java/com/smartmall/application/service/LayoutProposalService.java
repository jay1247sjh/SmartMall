package com.smartmall.application.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartmall.common.exception.BusinessException;
import com.smartmall.common.response.ResultCode;
import com.smartmall.common.util.IdGenerator;
import com.smartmall.domain.entity.Area;
import com.smartmall.domain.entity.Floor;
import com.smartmall.domain.entity.LayoutProposal;
import com.smartmall.domain.entity.User;
import com.smartmall.domain.enums.AreaStatus;
import com.smartmall.domain.enums.LayoutProposalStatus;
import com.smartmall.infrastructure.mapper.AreaMapper;
import com.smartmall.infrastructure.mapper.AreaPermissionMapper;
import com.smartmall.infrastructure.mapper.FloorMapper;
import com.smartmall.infrastructure.mapper.LayoutProposalMapper;
import com.smartmall.infrastructure.mapper.UserMapper;
import com.smartmall.interfaces.dto.merchant.AreaLayoutResponse;
import com.smartmall.interfaces.dto.merchant.LayoutProposalDetailDTO;
import com.smartmall.interfaces.dto.merchant.LayoutProposalListItemDTO;
import com.smartmall.interfaces.dto.merchant.StoreLayoutResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 区域建模提案服务
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class LayoutProposalService {

    private final LayoutProposalMapper layoutProposalMapper;
    private final AreaMapper areaMapper;
    private final AreaPermissionMapper areaPermissionMapper;
    private final FloorMapper floorMapper;
    private final UserMapper userMapper;
    private final ObjectMapper objectMapper;

    @Autowired
    @Lazy
    private LayoutVersionService layoutVersionService;

    /**
     * 获取商家区域布局（草稿优先）
     */
    public AreaLayoutResponse getAreaLayout(String areaId, String merchantId) {
        validatePermission(areaId, merchantId);

        LayoutProposal proposal = layoutProposalMapper.selectActiveByAreaAndMerchant(areaId, merchantId);
        if (proposal != null && isDraftLikeStatus(proposal.getStatus())) {
            AreaLayoutResponse response = new AreaLayoutResponse();
            response.setSource("PROPOSAL");
            response.setProposalId(proposal.getProposalId());
            response.setProposalStatus(proposal.getStatus().name());
            response.setRejectReason(proposal.getRejectReason());
            response.setUpdatedAt(proposal.getUpdateTime());
            response.setLayoutData(convertLayoutData(proposal.getLayoutData()));
            return response;
        }

        Area area = getAreaOrThrow(areaId);
        StoreLayoutResponse.StoreLayoutData areaLayout = extractLayoutFromAreaProperties(area.getProperties());
        AreaLayoutResponse response = new AreaLayoutResponse();
        if (areaLayout != null) {
            response.setSource("AREA");
            response.setProposalStatus("APPROVED");
            response.setLayoutData(areaLayout);
            response.setUpdatedAt(area.getUpdateTime());
        } else {
            response.setSource("EMPTY");
            response.setProposalStatus("NONE");
            response.setLayoutData(null);
            response.setUpdatedAt(area.getUpdateTime());
        }
        return response;
    }

    /**
     * 保存建模草稿
     */
    @Transactional
    public LayoutProposalListItemDTO saveDraft(
            String areaId,
            StoreLayoutResponse.StoreLayoutData layoutData,
            String merchantId
    ) {
        validatePermission(areaId, merchantId);
        ensureAreaEditable(areaId);
        LayoutProposal proposal = upsertProposal(
                areaId,
                merchantId,
                LayoutProposalStatus.DRAFT,
                layoutData,
                null,
                null
        );
        return toListItem(proposal, null, null, null);
    }

    /**
     * 提交建模提案
     */
    @Transactional
    public LayoutProposalListItemDTO submitProposal(
            String areaId,
            StoreLayoutResponse.StoreLayoutData layoutData,
            String submitNote,
            String merchantId
    ) {
        validatePermission(areaId, merchantId);
        ensureAreaEditable(areaId);
        LayoutProposal proposal = upsertProposal(
                areaId,
                merchantId,
                LayoutProposalStatus.PENDING_REVIEW,
                layoutData,
                submitNote,
                null
        );
        return toListItem(proposal, null, null, null);
    }

    /**
     * 查询待审核提案列表
     */
    public List<LayoutProposalListItemDTO> getPendingProposals() {
        List<LayoutProposal> proposals = layoutProposalMapper.selectPendingList();
        if (proposals.isEmpty()) {
            return List.of();
        }

        List<String> areaIds = proposals.stream()
                .map(LayoutProposal::getAreaId)
                .distinct()
                .collect(Collectors.toList());
        List<String> merchantIds = proposals.stream()
                .map(LayoutProposal::getMerchantId)
                .distinct()
                .collect(Collectors.toList());

        Map<String, Area> areaMap = areaMapper.selectBatchIds(areaIds).stream()
                .collect(Collectors.toMap(Area::getAreaId, a -> a));
        Map<String, User> merchantMap = userMapper.selectBatchIds(merchantIds).stream()
                .collect(Collectors.toMap(User::getUserId, u -> u));

        List<String> floorIds = areaMap.values().stream()
                .map(Area::getFloorId)
                .distinct()
                .collect(Collectors.toList());
        Map<String, Floor> floorMap = floorIds.isEmpty() ? Map.of() :
                floorMapper.selectBatchIds(floorIds).stream()
                        .collect(Collectors.toMap(Floor::getFloorId, f -> f));

        return proposals.stream()
                .map(proposal -> toListItem(proposal, areaMap.get(proposal.getAreaId()), floorMap, merchantMap))
                .collect(Collectors.toList());
    }

    /**
     * 查询提案详情
     */
    public LayoutProposalDetailDTO getProposalDetail(String proposalId) {
        LayoutProposal proposal = getProposalOrThrow(proposalId);
        Area area = getAreaOrThrow(proposal.getAreaId());
        Floor floor = floorMapper.selectById(area.getFloorId());
        User merchant = userMapper.selectById(proposal.getMerchantId());

        LayoutProposalDetailDTO dto = new LayoutProposalDetailDTO();
        dto.setProposalId(proposal.getProposalId());
        dto.setAreaId(proposal.getAreaId());
        dto.setAreaName(area.getName());
        dto.setFloorId(area.getFloorId());
        dto.setFloorName(floor != null ? floor.getName() : null);
        dto.setMerchantId(proposal.getMerchantId());
        dto.setMerchantName(merchant != null ? merchant.getUsername() : proposal.getMerchantId());
        dto.setStatus(proposal.getStatus().name());
        dto.setSubmitNote(proposal.getSubmitNote());
        dto.setRejectReason(proposal.getRejectReason());
        dto.setAreaBoundaries(area.getShape());
        dto.setLayoutData(convertLayoutData(proposal.getLayoutData()));
        dto.setCreatedAt(proposal.getCreateTime());
        dto.setUpdatedAt(proposal.getUpdateTime());
        dto.setReviewedAt(proposal.getReviewedAt());
        return dto;
    }

    /**
     * 审核通过
     */
    @Transactional
    public void approveProposal(String proposalId, String adminId) {
        LayoutProposal proposal = getProposalOrThrow(proposalId);
        if (proposal.getStatus() != LayoutProposalStatus.PENDING_REVIEW) {
            throw new BusinessException(ResultCode.LAYOUT_PROPOSAL_STATUS_INVALID, "提案状态不允许审核通过");
        }

        Area area = getAreaOrThrow(proposal.getAreaId());
        int permissionCount = areaPermissionMapper.countActiveByAreaAndMerchant(area.getAreaId(), proposal.getMerchantId());
        if (permissionCount <= 0) {
            throw new BusinessException(ResultCode.AREA_PERMISSION_DENIED);
        }

        StoreLayoutResponse.StoreLayoutData layoutData = convertLayoutData(proposal.getLayoutData());
        if (layoutData == null) {
            throw new BusinessException(ResultCode.PARAM_INVALID, "提案布局数据为空");
        }

        applyLayoutToArea(area, layoutData);
        if (area.getStatus() == AreaStatus.AUTHORIZED) {
            area.setStatus(AreaStatus.OCCUPIED);
        }
        areaMapper.updateById(area);

        proposal.setStatus(LayoutProposalStatus.APPROVED);
        proposal.setReviewedBy(adminId);
        proposal.setReviewedAt(LocalDateTime.now());
        proposal.setRejectReason(null);
        layoutProposalMapper.updateById(proposal);

        Floor floor = floorMapper.selectById(area.getFloorId());
        if (floor != null) {
            layoutVersionService.createVersionFromProject(floor.getProjectId(), adminId);
        } else {
            log.warn("审批通过后未找到楼层信息，跳过版本快照: proposalId={}, areaId={}", proposalId, area.getAreaId());
        }
    }

    /**
     * 审核驳回
     */
    @Transactional
    public void rejectProposal(String proposalId, String reason, String adminId) {
        LayoutProposal proposal = getProposalOrThrow(proposalId);
        if (proposal.getStatus() != LayoutProposalStatus.PENDING_REVIEW) {
            throw new BusinessException(ResultCode.LAYOUT_PROPOSAL_STATUS_INVALID, "提案状态不允许驳回");
        }

        proposal.setStatus(LayoutProposalStatus.REJECTED);
        proposal.setReviewedBy(adminId);
        proposal.setReviewedAt(LocalDateTime.now());
        proposal.setRejectReason(reason);
        layoutProposalMapper.updateById(proposal);
    }

    private void applyLayoutToArea(Area area, StoreLayoutResponse.StoreLayoutData layoutData) {
        Map<String, Object> properties = area.getProperties() != null
                ? new HashMap<>(area.getProperties())
                : new HashMap<>();

        Map<String, Object> custom = new HashMap<>();
        Object existingCustom = properties.get("custom");
        if (existingCustom instanceof Map<?, ?> customMap) {
            custom.putAll(convertStringKeyMap(customMap));
        }
        custom.put("storeLayout", objectMapper.convertValue(layoutData, Map.class));
        properties.put("custom", custom);
        area.setProperties(properties);
    }

    private LayoutProposal upsertProposal(
            String areaId,
            String merchantId,
            LayoutProposalStatus status,
            StoreLayoutResponse.StoreLayoutData layoutData,
            String submitNote,
            String rejectReason
    ) {
        LayoutProposal proposal = layoutProposalMapper.selectActiveByAreaAndMerchant(areaId, merchantId);
        if (proposal == null) {
            proposal = new LayoutProposal();
            proposal.setProposalId(IdGenerator.nextId());
            proposal.setAreaId(areaId);
            proposal.setMerchantId(merchantId);
            proposal.setVersion(0);
            proposal.setIsDeleted(false);
            proposal.setStatus(status);
            proposal.setLayoutData(objectMapper.convertValue(layoutData, Map.class));
            proposal.setSubmitNote(submitNote);
            proposal.setRejectReason(rejectReason);
            proposal.setReviewedBy(null);
            proposal.setReviewedAt(null);
            layoutProposalMapper.insert(proposal);
            return proposal;
        }

        proposal.setStatus(status);
        proposal.setLayoutData(objectMapper.convertValue(layoutData, Map.class));
        proposal.setSubmitNote(submitNote);
        proposal.setRejectReason(rejectReason);
        proposal.setReviewedBy(null);
        proposal.setReviewedAt(null);
        layoutProposalMapper.updateById(proposal);
        return layoutProposalMapper.selectById(proposal.getProposalId());
    }

    private LayoutProposalListItemDTO toListItem(
            LayoutProposal proposal,
            Area area,
            Map<String, Floor> floorMap,
            Map<String, User> merchantMap
    ) {
        LayoutProposalListItemDTO dto = new LayoutProposalListItemDTO();
        dto.setProposalId(proposal.getProposalId());
        dto.setAreaId(proposal.getAreaId());
        dto.setStatus(proposal.getStatus().name());
        dto.setSubmitNote(proposal.getSubmitNote());
        dto.setRejectReason(proposal.getRejectReason());
        dto.setCreatedAt(proposal.getCreateTime());
        dto.setUpdatedAt(proposal.getUpdateTime());
        dto.setReviewedAt(proposal.getReviewedAt());

        StoreLayoutResponse.StoreLayoutData data = convertLayoutData(proposal.getLayoutData());
        dto.setObjectCount(data != null && data.getObjects() != null ? data.getObjects().size() : 0);

        if (area != null) {
            dto.setAreaName(area.getName());
            Floor floor = floorMap != null ? floorMap.get(area.getFloorId()) : null;
            dto.setFloorName(floor != null ? floor.getName() : null);
        }

        dto.setMerchantId(proposal.getMerchantId());
        if (merchantMap != null) {
            User merchant = merchantMap.get(proposal.getMerchantId());
            dto.setMerchantName(merchant != null ? merchant.getUsername() : proposal.getMerchantId());
        }

        return dto;
    }

    private boolean isDraftLikeStatus(LayoutProposalStatus status) {
        return status == LayoutProposalStatus.DRAFT
                || status == LayoutProposalStatus.PENDING_REVIEW
                || status == LayoutProposalStatus.REJECTED;
    }

    private LayoutProposal getProposalOrThrow(String proposalId) {
        LayoutProposal proposal = layoutProposalMapper.selectById(proposalId);
        if (proposal == null || Boolean.TRUE.equals(proposal.getIsDeleted())) {
            throw new BusinessException(ResultCode.LAYOUT_PROPOSAL_NOT_FOUND);
        }
        return proposal;
    }

    private Area getAreaOrThrow(String areaId) {
        Area area = areaMapper.selectById(areaId);
        if (area == null || Boolean.TRUE.equals(area.getIsDeleted())) {
            throw new BusinessException(ResultCode.AREA_NOT_FOUND);
        }
        return area;
    }

    private void validatePermission(String areaId, String merchantId) {
        int permCount = areaPermissionMapper.countActiveByAreaAndMerchant(areaId, merchantId);
        if (permCount <= 0) {
            throw new BusinessException(ResultCode.AREA_PERMISSION_DENIED);
        }
    }

    private void ensureAreaEditable(String areaId) {
        Area area = getAreaOrThrow(areaId);
        AreaStatus status = area.getStatus();
        if (status != AreaStatus.AUTHORIZED && status != AreaStatus.OCCUPIED) {
            throw new BusinessException(ResultCode.AREA_NOT_AVAILABLE, "该区域当前状态不允许编辑");
        }
    }

    private StoreLayoutResponse.StoreLayoutData extractLayoutFromAreaProperties(Map<String, Object> properties) {
        if (properties == null) {
            return null;
        }
        Object customObj = properties.get("custom");
        if (!(customObj instanceof Map<?, ?> customMap)) {
            return null;
        }
        Object layoutObj = customMap.get("storeLayout");
        if (layoutObj == null) {
            return null;
        }
        return objectMapper.convertValue(layoutObj, StoreLayoutResponse.StoreLayoutData.class);
    }

    private StoreLayoutResponse.StoreLayoutData convertLayoutData(Map<String, Object> layoutData) {
        if (layoutData == null || layoutData.isEmpty()) {
            return null;
        }
        return objectMapper.convertValue(layoutData, StoreLayoutResponse.StoreLayoutData.class);
    }

    private Map<String, Object> convertStringKeyMap(Map<?, ?> source) {
        Map<String, Object> target = new HashMap<>();
        source.forEach((k, v) -> {
            if (k != null) {
                target.put(String.valueOf(k), v);
            }
        });
        return target;
    }
}

