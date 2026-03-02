package com.smartmall.application.service.navigation;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.smartmall.application.service.MallBuilderService;
import com.smartmall.common.exception.BusinessException;
import com.smartmall.common.response.ResultCode;
import com.smartmall.common.util.IdGenerator;
import com.smartmall.domain.entity.NavigationDynamicEvent;
import com.smartmall.interfaces.dto.mallbuilder.ProjectResponse;
import com.smartmall.infrastructure.mapper.NavigationDynamicEventMapper;
import com.smartmall.interfaces.dto.navigation.CreateNavigationDynamicEventRequest;
import com.smartmall.interfaces.dto.navigation.NavigationDynamicEventDTO;
import com.smartmall.interfaces.dto.navigation.NavigationDynamicVersionResponse;
import com.smartmall.interfaces.dto.navigation.UpdateNavigationDynamicEventRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;
import java.util.Objects;

@Slf4j
@Service
@RequiredArgsConstructor
public class NavigationDynamicEventService {

    private static final String TYPE_BLOCK = "BLOCK";
    private static final String TYPE_CONGESTION = "CONGESTION";
    private static final String SCOPE_AREA = "AREA";
    private static final String SCOPE_CONNECTION = "CONNECTION";

    private static final String STATUS_ACTIVE = "ACTIVE";
    private static final String STATUS_INACTIVE = "INACTIVE";
    private static final String STATUS_EXPIRED = "EXPIRED";

    private final NavigationDynamicEventMapper navigationDynamicEventMapper;
    private final MallBuilderService mallBuilderService;

    @Transactional
    public NavigationDynamicEventDTO create(CreateNavigationDynamicEventRequest request, String operatorId) {
        validateCreateRequest(request);

        NavigationDynamicEvent entity = new NavigationDynamicEvent();
        entity.setEventId(normalizeId(IdGenerator.nextId()));
        entity.setProjectId(normalizeId(request.getProjectId()));
        entity.setEventType(normalizeEnum(request.getEventType()));
        entity.setScopeType(normalizeEnum(request.getScopeType()));
        entity.setScopeId(request.getScopeId().trim());
        entity.setSeverity(normalizeNullableEnum(request.getSeverity()));
        entity.setCostMultiplier(request.getCostMultiplier());
        entity.setStartsAt(request.getStartsAt());
        entity.setEndsAt(request.getEndsAt());
        entity.setStatus(STATUS_ACTIVE);
        entity.setReason(request.getReason());
        entity.setCreatedBy(operatorId);
        entity.setVersion(0);
        entity.setIsDeleted(false);

        navigationDynamicEventMapper.insert(entity);
        return toDto(navigationDynamicEventMapper.selectById(entity.getEventId()));
    }

    @Transactional
    public NavigationDynamicEventDTO update(String eventId, UpdateNavigationDynamicEventRequest request) {
        NavigationDynamicEvent entity = getOrThrow(eventId);

        if (request.getEventType() != null) {
            entity.setEventType(normalizeEnum(request.getEventType()));
        }
        if (request.getScopeType() != null) {
            entity.setScopeType(normalizeEnum(request.getScopeType()));
        }
        if (request.getScopeId() != null && !request.getScopeId().isBlank()) {
            entity.setScopeId(request.getScopeId().trim());
        }
        if (request.getSeverity() != null) {
            entity.setSeverity(normalizeNullableEnum(request.getSeverity()));
        }
        if (request.getCostMultiplier() != null) {
            entity.setCostMultiplier(request.getCostMultiplier());
        }
        if (request.getStartsAt() != null) {
            entity.setStartsAt(request.getStartsAt());
        }
        if (request.getEndsAt() != null) {
            entity.setEndsAt(request.getEndsAt());
        }
        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            entity.setStatus(normalizeStatus(request.getStatus()));
        }
        if (request.getReason() != null) {
            entity.setReason(request.getReason());
        }

        validateEntity(entity);
        navigationDynamicEventMapper.updateById(entity);
        return toDto(navigationDynamicEventMapper.selectById(entity.getEventId()));
    }

    @Transactional
    public void deactivate(String eventId) {
        NavigationDynamicEvent entity = getOrThrow(eventId);
        entity.setStatus(STATUS_INACTIVE);
        navigationDynamicEventMapper.updateById(entity);
    }

    public List<NavigationDynamicEventDTO> listByProject(String projectId) {
        String effectiveProjectId = resolveProjectId(projectId);
        if (effectiveProjectId == null) {
            return List.of();
        }

        LambdaQueryWrapper<NavigationDynamicEvent> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(NavigationDynamicEvent::getProjectId, effectiveProjectId)
                .eq(NavigationDynamicEvent::getIsDeleted, false)
                .orderByDesc(NavigationDynamicEvent::getUpdateTime);

        List<NavigationDynamicEvent> entities = navigationDynamicEventMapper.selectList(wrapper);
        List<NavigationDynamicEventDTO> result = new ArrayList<>(entities.size());
        for (NavigationDynamicEvent entity : entities) {
            result.add(toDto(entity));
        }
        return result;
    }

    public List<NavigationDynamicEvent> listActiveEvents(String projectId, LocalDateTime now) {
        String effectiveProjectId = resolveProjectId(projectId);
        if (effectiveProjectId == null) {
            return List.of();
        }
        return navigationDynamicEventMapper.selectActiveByProjectAt(effectiveProjectId, now);
    }

    public NavigationDynamicVersionResponse getDynamicVersion(String projectId) {
        String effectiveProjectId = resolveProjectId(projectId);
        NavigationDynamicVersionResponse response = new NavigationDynamicVersionResponse();
        response.setProjectId(effectiveProjectId);
        response.setServerTime(LocalDateTime.now());

        if (effectiveProjectId == null) {
            response.setDynamicVersion("none");
            return response;
        }

        List<NavigationDynamicEvent> activeEvents = listActiveEvents(effectiveProjectId, LocalDateTime.now());
        response.setDynamicVersion(buildDynamicVersion(effectiveProjectId, activeEvents));
        return response;
    }

    public String buildDynamicVersion(String projectId, List<NavigationDynamicEvent> activeEvents) {
        if (projectId == null || projectId.isBlank()) {
            return "none";
        }

        long maxUpdatedMillis = 0L;
        int count = 0;
        for (NavigationDynamicEvent event : activeEvents) {
            if (event == null) {
                continue;
            }
            count++;
            LocalDateTime updateTime = event.getUpdateTime() != null ? event.getUpdateTime() : event.getCreateTime();
            if (updateTime != null) {
                maxUpdatedMillis = Math.max(maxUpdatedMillis, updateTime.toInstant(ZoneOffset.UTC).toEpochMilli());
            }
        }

        String payload = normalizeId(projectId) + "|" + maxUpdatedMillis + "|" + count;
        return md5Hex(payload);
    }

    private void validateCreateRequest(CreateNavigationDynamicEventRequest request) {
        validateEnum(normalizeEnum(request.getEventType()), TYPE_BLOCK, TYPE_CONGESTION, "eventType");
        validateEnum(normalizeEnum(request.getScopeType()), SCOPE_AREA, SCOPE_CONNECTION, "scopeType");
        if (request.getScopeId() == null || request.getScopeId().isBlank()) {
            throw new BusinessException(ResultCode.PARAM_ERROR, "scopeId 不能为空");
        }
        validateTimeRange(request.getStartsAt(), request.getEndsAt());

        if (TYPE_CONGESTION.equals(normalizeEnum(request.getEventType()))
                && request.getCostMultiplier() == null
                && normalizeNullableEnum(request.getSeverity()) == null) {
            throw new BusinessException(ResultCode.PARAM_ERROR, "CONGESTION 事件必须设置 severity 或 costMultiplier");
        }
    }

    private void validateEntity(NavigationDynamicEvent entity) {
        validateEnum(entity.getEventType(), TYPE_BLOCK, TYPE_CONGESTION, "eventType");
        validateEnum(entity.getScopeType(), SCOPE_AREA, SCOPE_CONNECTION, "scopeType");
        validateStatus(entity.getStatus());
        if (entity.getScopeId() == null || entity.getScopeId().isBlank()) {
            throw new BusinessException(ResultCode.PARAM_ERROR, "scopeId 不能为空");
        }
        validateTimeRange(entity.getStartsAt(), entity.getEndsAt());

        if (TYPE_CONGESTION.equals(entity.getEventType())
                && entity.getCostMultiplier() == null
                && entity.getSeverity() == null) {
            throw new BusinessException(ResultCode.PARAM_ERROR, "CONGESTION 事件必须设置 severity 或 costMultiplier");
        }
    }

    private void validateTimeRange(LocalDateTime startsAt, LocalDateTime endsAt) {
        if (startsAt == null) {
            throw new BusinessException(ResultCode.PARAM_ERROR, "startsAt 不能为空");
        }
        if (endsAt != null && endsAt.isBefore(startsAt)) {
            throw new BusinessException(ResultCode.PARAM_ERROR, "endsAt 不能早于 startsAt");
        }
    }

    private void validateStatus(String status) {
        validateEnum(status, STATUS_ACTIVE, STATUS_INACTIVE, STATUS_EXPIRED, "status");
    }

    private void validateEnum(String value, String one, String two, String fieldName) {
        validateEnum(value, new String[]{one, two}, fieldName);
    }

    private void validateEnum(String value, String one, String two, String three, String fieldName) {
        validateEnum(value, new String[]{one, two, three}, fieldName);
    }

    private void validateEnum(String value, String[] allowed, String fieldName) {
        for (String item : allowed) {
            if (Objects.equals(value, item)) {
                return;
            }
        }
        throw new BusinessException(ResultCode.PARAM_ERROR, fieldName + " 不合法");
    }

    private String normalizeStatus(String value) {
        String normalized = normalizeEnum(value);
        validateStatus(normalized);
        return normalized;
    }

    private String normalizeEnum(String value) {
        if (value == null) {
            return "";
        }
        return value.trim().toUpperCase(Locale.ROOT);
    }

    private String normalizeNullableEnum(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim().toUpperCase(Locale.ROOT);
    }

    private String resolveProjectId(String preferredProjectId) {
        if (preferredProjectId != null && !preferredProjectId.isBlank()) {
            return normalizeId(preferredProjectId);
        }
        ProjectResponse published = mallBuilderService.getPublishedMall();
        if (published == null || published.getProjectId() == null || published.getProjectId().isBlank()) {
            return null;
        }
        return normalizeId(published.getProjectId());
    }

    private NavigationDynamicEvent getOrThrow(String eventId) {
        NavigationDynamicEvent entity = navigationDynamicEventMapper.selectById(normalizeId(eventId));
        if (entity == null || Boolean.TRUE.equals(entity.getIsDeleted())) {
            throw new BusinessException(ResultCode.NOT_FOUND, "动态事件不存在");
        }
        return entity;
    }

    private NavigationDynamicEventDTO toDto(NavigationDynamicEvent entity) {
        NavigationDynamicEventDTO dto = new NavigationDynamicEventDTO();
        dto.setEventId(entity.getEventId());
        dto.setProjectId(entity.getProjectId());
        dto.setEventType(entity.getEventType());
        dto.setScopeType(entity.getScopeType());
        dto.setScopeId(entity.getScopeId());
        dto.setSeverity(entity.getSeverity());
        dto.setCostMultiplier(entity.getCostMultiplier());
        dto.setStartsAt(entity.getStartsAt());
        dto.setEndsAt(entity.getEndsAt());
        dto.setStatus(entity.getStatus());
        dto.setReason(entity.getReason());
        dto.setCreatedBy(entity.getCreatedBy());
        dto.setCreatedAt(entity.getCreateTime());
        dto.setUpdatedAt(entity.getUpdateTime());
        return dto;
    }

    public double resolveCongestionMultiplier(NavigationDynamicEvent event) {
        if (event == null) {
            return 1D;
        }
        BigDecimal explicit = event.getCostMultiplier();
        if (explicit != null && explicit.doubleValue() >= 1D) {
            return explicit.doubleValue();
        }
        String severity = normalizeNullableEnum(event.getSeverity());
        if ("LOW".equals(severity)) {
            return 1.15D;
        }
        if ("MEDIUM".equals(severity)) {
            return 1.35D;
        }
        if ("HIGH".equals(severity)) {
            return 1.70D;
        }
        return 1D;
    }

    private String md5Hex(String raw) {
        try {
            MessageDigest digest = MessageDigest.getInstance("MD5");
            byte[] hash = digest.digest(raw.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            log.warn("MD5 不可用，回退 payload 原值: {}", e.getMessage());
            return raw;
        }
    }

    private String normalizeId(String externalId) {
        if (externalId == null || externalId.isBlank()) {
            return externalId;
        }
        String normalized = externalId.replace("-", "");
        return normalized.length() > 32 ? normalized.substring(0, 32) : normalized;
    }
}

