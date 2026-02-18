package com.smartmall.application.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartmall.common.exception.BusinessException;
import com.smartmall.common.response.ResultCode;
import com.smartmall.domain.entity.Area;
import com.smartmall.domain.entity.Floor;
import com.smartmall.domain.entity.LayoutVersion;
import com.smartmall.domain.entity.MallProject;
import com.smartmall.infrastructure.mapper.AreaMapper;
import com.smartmall.infrastructure.mapper.FloorMapper;
import com.smartmall.infrastructure.mapper.LayoutVersionMapper;
import com.smartmall.infrastructure.mapper.MallProjectMapper;
import com.smartmall.interfaces.dto.mallbuilder.AreaResponse;
import com.smartmall.interfaces.dto.mallbuilder.FloorResponse;
import com.smartmall.interfaces.dto.mallbuilder.ProjectResponse;
import com.smartmall.interfaces.dto.version.LayoutVersionListItem;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * 布局版本管理服务
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class LayoutVersionService {

    private final LayoutVersionMapper layoutVersionMapper;
    private final MallProjectMapper mallProjectMapper;
    private final MallBuilderService mallBuilderService;
    private final FloorMapper floorMapper;
    private final AreaMapper areaMapper;
    private final ObjectMapper objectMapper;

    /**
     * 发布时由 MallBuilderService 调用，创建版本快照
     */
    @Transactional
    public LayoutVersion createVersionFromProject(String projectId, String creatorId) {
        // 1. 获取完整的 ProjectResponse 快照
        ProjectResponse projectResponse = mallBuilderService.getProjectById(projectId);

        // 2. 生成版本号
        String versionNumber = generateVersionNumber(projectId);

        // 3. 计算变更数量（所有楼层的区域总数）
        int changeCount = 0;
        if (projectResponse.getFloors() != null) {
            for (var floor : projectResponse.getFloors()) {
                if (floor.getAreas() != null) {
                    changeCount += floor.getAreas().size();
                }
            }
        }

        // 4. 将 ProjectResponse 转换为 Map 用于 JSONB 存储
        @SuppressWarnings("unchecked")
        Map<String, Object> snapshotData = objectMapper.convertValue(projectResponse, Map.class);

        // 5. 构建 LayoutVersion 实体并插入
        LayoutVersion version = new LayoutVersion();
        version.setVersionId(generateId());
        version.setVersionNumber(versionNumber);
        version.setStatus("PUBLISHED");
        version.setDescription("");
        version.setSnapshotData(snapshotData);
        version.setSourceProjectId(projectId);
        version.setSchemaVersion(1);
        version.setChangeCount(changeCount);
        version.setCreatorId(creatorId);
        version.setVersion(0);

        layoutVersionMapper.insert(version);

        log.info("版本快照已创建: versionId={}, versionNumber={}, projectId={}, creatorId={}",
                version.getVersionId(), versionNumber, projectId, creatorId);

        return version;
    }

    // ==================== 版本列表（Task 2.2） ====================

    public List<LayoutVersionListItem> getVersionList() {
        LambdaQueryWrapper<LayoutVersion> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(LayoutVersion::getIsDeleted, false)
                .orderByDesc(LayoutVersion::getCreateTime);
        List<LayoutVersion> versions = layoutVersionMapper.selectList(wrapper);
        return versions.stream().map(this::toListItem).collect(Collectors.toList());
    }

    // ==================== 版本快照查询（Task 2.3） ====================

    public ProjectResponse getVersionSnapshot(String versionId) {
        LayoutVersion version = findVersionOrThrow(versionId);
        return objectMapper.convertValue(version.getSnapshotData(), ProjectResponse.class);
    }

    // ==================== 版本描述更新（Task 2.4） ====================

    public LayoutVersionListItem updateDescription(String versionId, String description) {
        LayoutVersion version = findVersionOrThrow(versionId);
        version.setDescription(description);
        layoutVersionMapper.updateById(version);
        return toListItem(version);
    }

    // ==================== 版本激活（Task 2.5） ====================

    @Transactional
    public LayoutVersionListItem activateVersion(String versionId) {
        // 1. 查找目标版本并校验状态
        LayoutVersion target = findVersionOrThrow(versionId);
        if (!"PUBLISHED".equals(target.getStatus()) && !"ARCHIVED".equals(target.getStatus())) {
            throw new BusinessException("A2002", "当前版本状态不允许执行此操作");
        }

        // 2. 将当前 ACTIVE 版本改为 ARCHIVED
        LambdaQueryWrapper<LayoutVersion> activeWrapper = new LambdaQueryWrapper<>();
        activeWrapper.eq(LayoutVersion::getStatus, "ACTIVE")
                .eq(LayoutVersion::getIsDeleted, false);
        LayoutVersion currentActive = layoutVersionMapper.selectOne(activeWrapper);
        if (currentActive != null) {
            currentActive.setStatus("ARCHIVED");
            layoutVersionMapper.updateById(currentActive);
        }

        // 3. 将目标版本设为 ACTIVE
        target.setStatus("ACTIVE");
        layoutVersionMapper.updateById(target);

        log.info("版本已激活: versionId={}, versionNumber={}", versionId, target.getVersionNumber());
        return toListItem(target);
    }

    // ==================== 恢复为新草稿（Task 2.7） ====================

    @Transactional
    public ProjectResponse restoreAsDraft(String versionId, String userId) {
        // 1. 查找版本
        LayoutVersion version = findVersionOrThrow(versionId);

        // 2. 检查是否已存在 DRAFT 项目
        LambdaQueryWrapper<MallProject> draftWrapper = new LambdaQueryWrapper<>();
        draftWrapper.eq(MallProject::getStatus, "DRAFT")
                .eq(MallProject::getIsDeleted, false);
        Long draftCount = mallProjectMapper.selectCount(draftWrapper);
        if (draftCount > 0) {
            throw new BusinessException("A2001", "已存在草稿项目，请先处理现有草稿后再恢复");
        }

        // 3. 从快照数据转换为 ProjectResponse
        ProjectResponse snapshot = objectMapper.convertValue(version.getSnapshotData(), ProjectResponse.class);

        // 4. 创建新的 MallProject
        String newProjectId = generateId();
        MallProject project = new MallProject();
        project.setProjectId(newProjectId);
        project.setName(snapshot.getName());
        project.setDescription(snapshot.getDescription());
        project.setOutline(objectMapper.convertValue(snapshot.getOutline(), Map.class));
        project.setSettings(objectMapper.convertValue(snapshot.getSettings(), Map.class));
        project.setCreatorId(userId);
        project.setStatus("DRAFT");
        project.setIsDeleted(false);
        project.setVersion(0);
        mallProjectMapper.insert(project);

        // 5. 创建楼层和区域
        if (snapshot.getFloors() != null) {
            for (FloorResponse floorResp : snapshot.getFloors()) {
                String newFloorId = generateId();
                Floor floor = new Floor();
                floor.setFloorId(newFloorId);
                floor.setProjectId(newProjectId);
                floor.setName(floorResp.getName());
                floor.setLevel(floorResp.getLevel());
                floor.setHeight(floorResp.getHeight());
                floor.setShape(objectMapper.convertValue(floorResp.getShape(), Map.class));
                floor.setInheritOutline(floorResp.getInheritOutline());
                floor.setColor(floorResp.getColor());
                floor.setVisible(floorResp.getVisible());
                floor.setLocked(floorResp.getLocked());
                floor.setSortOrder(floorResp.getSortOrder());
                floor.setIsDeleted(false);
                floor.setVersion(0);
                floorMapper.insert(floor);

                if (floorResp.getAreas() != null) {
                    for (AreaResponse areaResp : floorResp.getAreas()) {
                        Area area = new Area();
                        area.setAreaId(generateId());
                        area.setFloorId(newFloorId);
                        area.setName(areaResp.getName());
                        area.setType(areaResp.getType());
                        area.setShape(objectMapper.convertValue(areaResp.getShape(), Map.class));
                        area.setColor(areaResp.getColor());
                        area.setProperties(areaResp.getProperties());
                        area.setMerchantId(areaResp.getMerchantId());
                        area.setRental(areaResp.getRental());
                        area.setVisible(areaResp.getVisible());
                        area.setLocked(areaResp.getLocked());
                        area.setIsDeleted(false);
                        area.setVersion(0);
                        areaMapper.insert(area);
                    }
                }
            }
        }

        log.info("版本已恢复为草稿: versionId={}, newProjectId={}, userId={}",
                versionId, newProjectId, userId);

        // 6. 返回新项目的完整数据
        return mallBuilderService.getProjectById(newProjectId);
    }

    // ==================== 版本删除（Task 2.6） ====================

    public void deleteVersion(String versionId) {
        LayoutVersion version = findVersionOrThrow(versionId);
        if ("ACTIVE".equals(version.getStatus())) {
            throw new BusinessException("A2003", "当前激活版本不可删除，请先激活其他版本");
        }
        layoutVersionMapper.deleteById(versionId);
    }

    // ==================== 私有方法 ====================

    /**
     * 生成版本号: "v{projectSequence}.{count}"
     * - projectSequence: 项目在系统中的创建顺序编号（按 created_at 排序）
     * - count: 该项目已有的版本数量
     */
    private String generateVersionNumber(String projectId) {
        // 1. 查询项目序号（按 created_at 排序确定在所有项目中的位置）
        LambdaQueryWrapper<MallProject> projectWrapper = new LambdaQueryWrapper<>();
        projectWrapper.eq(MallProject::getIsDeleted, false)
                .orderByAsc(MallProject::getCreateTime);
        List<MallProject> allProjects = mallProjectMapper.selectList(projectWrapper);

        int projectSequence = 0;
        for (int i = 0; i < allProjects.size(); i++) {
            if (allProjects.get(i).getProjectId().equals(projectId)) {
                projectSequence = i + 1; // 序号从 1 开始
                break;
            }
        }

        if (projectSequence == 0) {
            throw new BusinessException(ResultCode.NOT_FOUND, "项目不存在");
        }

        // 2. 查询该项目已有的版本数量（包括已删除的，确保版本号不重复）
        long count = layoutVersionMapper.countAllByProjectId(projectId);

        // 3. 生成版本号
        return String.format("v%d.%d", projectSequence, count);
    }

    private String generateId() {
        return UUID.randomUUID().toString().replace("-", "").substring(0, 32);
    }

    /**
     * 查找版本，不存在或已删除则抛出 BusinessException
     */
    private LayoutVersion findVersionOrThrow(String versionId) {
        LayoutVersion version = layoutVersionMapper.selectById(versionId);
        if (version == null) {
            throw new BusinessException("A4001", "版本不存在");
        }
        return version;
    }

    /**
     * 将 LayoutVersion 实体转换为列表 DTO（不含 snapshotData）
     */
    private LayoutVersionListItem toListItem(LayoutVersion version) {
        LayoutVersionListItem item = new LayoutVersionListItem();
        item.setVersionId(version.getVersionId());
        item.setVersionNumber(version.getVersionNumber());
        item.setStatus(version.getStatus());
        item.setDescription(version.getDescription());
        item.setChangeCount(version.getChangeCount());
        item.setSourceProjectId(version.getSourceProjectId());
        item.setSchemaVersion(version.getSchemaVersion());
        item.setCreatorId(version.getCreatorId());
        item.setCreatedAt(version.getCreateTime());
        item.setUpdatedAt(version.getUpdateTime());
        return item;
    }
}
