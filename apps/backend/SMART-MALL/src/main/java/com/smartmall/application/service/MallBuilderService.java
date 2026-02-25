package com.smartmall.application.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartmall.common.exception.BusinessException;
import com.smartmall.common.response.ResultCode;
import com.smartmall.domain.entity.Area;
import com.smartmall.domain.enums.AreaStatus;
import com.smartmall.domain.entity.Floor;
import com.smartmall.domain.entity.MallProject;
import com.smartmall.infrastructure.mapper.AreaMapper;
import com.smartmall.infrastructure.mapper.FloorMapper;
import com.smartmall.infrastructure.mapper.MallProjectMapper;
import com.smartmall.interfaces.dto.mallbuilder.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * 商城建模器服务
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MallBuilderService {
    
    private final MallProjectMapper projectMapper;
    private final FloorMapper floorMapper;
    private final AreaMapper areaMapper;
    private final ObjectMapper objectMapper;

    @Autowired
    @Lazy
    private LayoutVersionService layoutVersionService;
    
    /**
     * 创建项目
     */
    @Transactional
    public ProjectResponse createProject(CreateProjectRequest request, String creatorId) {
        // 1. 创建项目实体
        MallProject project = new MallProject();
        project.setProjectId(generateId());
        project.setName(request.getName());
        project.setDescription(request.getDescription());
        project.setOutline(convertToMap(request.getOutline()));
        project.setSettings(convertToMap(request.getSettings()));
        project.setCreatorId(creatorId);
        project.setVersion(1);
        
        projectMapper.insert(project);
        
        // 2. 保存楼层和区域
        if (request.getFloors() != null) {
            for (FloorDTO floorDTO : request.getFloors()) {
                saveFloor(floorDTO, project.getProjectId());
            }
        }
        
        // 3. 返回完整项目
        return getProjectById(project.getProjectId());
    }
    
    /**
     * 获取项目列表
     */
    public List<ProjectListItem> getProjectList(String creatorId) {
        LambdaQueryWrapper<MallProject> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(MallProject::getCreatorId, creatorId)
               .eq(MallProject::getIsDeleted, false)
               .orderByDesc(MallProject::getUpdateTime);
        
        List<MallProject> projects = projectMapper.selectList(wrapper);
        
        return projects.stream().map(project -> {
            ProjectListItem item = new ProjectListItem();
            item.setProjectId(project.getProjectId());
            item.setName(project.getName());
            item.setDescription(project.getDescription());
            item.setCreatedAt(project.getCreateTime());
            item.setUpdatedAt(project.getUpdateTime());
            
            // 统计楼层和区域数量
            int floorCount = countFloors(project.getProjectId());
            int areaCount = countAreas(project.getProjectId());
            item.setFloorCount(floorCount);
            item.setAreaCount(areaCount);
            
            return item;
        }).collect(Collectors.toList());
    }
    
    /**
     * 获取已发布的商城项目（公开接口）
     * 查询 status = PUBLISHED 的项目
     */
    public ProjectResponse getPublishedMall() {
        LambdaQueryWrapper<MallProject> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(MallProject::getIsDeleted, false)
               .eq(MallProject::getStatus, "PUBLISHED")
               .orderByDesc(MallProject::getUpdateTime)
               .last("LIMIT 1");
        
        MallProject project = projectMapper.selectOne(wrapper);
        if (project == null) {
            return null;
        }
        
        // 加载楼层和区域
        List<Floor> floors = getFloorsByProjectId(project.getProjectId());
        for (Floor floor : floors) {
            List<Area> areas = getAreasByFloorId(floor.getFloorId());
            floor.setAreas(areas);
        }
        project.setFloors(floors);
        
        return convertToResponse(project);
    }

    /**
     * 发布项目
     * 将指定项目标记为 PUBLISHED，同时将其他已发布项目回退为 DRAFT
     */
    @Transactional
    public ProjectResponse publishProject(String projectId, String userId) {
        MallProject project = projectMapper.selectById(projectId);
        if (project == null || project.getIsDeleted()) {
            throw new BusinessException(ResultCode.NOT_FOUND, "项目不存在");
        }
        
        if (!project.getCreatorId().equals(userId)) {
            throw new BusinessException(ResultCode.FORBIDDEN, "无权发布此项目");
        }
        
        // 将其他已发布项目回退为草稿
        LambdaQueryWrapper<MallProject> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(MallProject::getStatus, "PUBLISHED")
               .eq(MallProject::getIsDeleted, false)
               .ne(MallProject::getProjectId, projectId);
        
        List<MallProject> publishedProjects = projectMapper.selectList(wrapper);
        for (MallProject p : publishedProjects) {
            p.setStatus("DRAFT");
            projectMapper.updateById(p);
        }
        
        // 发布当前项目
        project.setStatus("PUBLISHED");
        projectMapper.updateById(project);
        
        // 创建版本快照
        layoutVersionService.createVersionFromProject(projectId, userId);
        
        log.info("项目已发布: projectId={}, userId={}", projectId, userId);
        
        return getProjectById(projectId);
    }

    /**
     * 获取项目详情
     */
    public ProjectResponse getProjectById(String projectId) {
        MallProject project = projectMapper.selectById(projectId);
        if (project == null || project.getIsDeleted()) {
            throw new BusinessException(ResultCode.NOT_FOUND, "项目不存在");
        }
        
        // 加载楼层
        List<Floor> floors = getFloorsByProjectId(projectId);
        
        // 加载每个楼层的区域
        for (Floor floor : floors) {
            List<Area> areas = getAreasByFloorId(floor.getFloorId());
            floor.setAreas(areas);
        }
        project.setFloors(floors);
        
        return convertToResponse(project);
    }

    
    /**
     * 更新项目
     */
    @Transactional
    public ProjectResponse updateProject(String projectId, UpdateProjectRequest request, String userId) {
        MallProject project = projectMapper.selectById(projectId);
        if (project == null || project.getIsDeleted()) {
            throw new BusinessException(ResultCode.NOT_FOUND, "项目不存在");
        }
        
        // 检查权限
        if (!project.getCreatorId().equals(userId)) {
            throw new BusinessException(ResultCode.FORBIDDEN, "无权修改此项目");
        }
        
        // 乐观锁检查
        if (request.getVersion() != null && !request.getVersion().equals(project.getVersion())) {
            throw new BusinessException(ResultCode.CONFLICT, "项目已被其他人修改，请刷新后重试");
        }
        
        // 更新项目基本信息
        project.setName(request.getName());
        project.setDescription(request.getDescription());
        project.setOutline(convertToMap(request.getOutline()));
        project.setSettings(convertToMap(request.getSettings()));
        project.setVersion(project.getVersion() + 1);
        
        projectMapper.updateById(project);
        
        // 删除旧的楼层和区域，重新保存
        deleteFloorsAndAreas(projectId);
        
        if (request.getFloors() != null) {
            for (FloorDTO floorDTO : request.getFloors()) {
                saveFloor(floorDTO, projectId);
            }
        }
        
        return getProjectById(projectId);
    }
    
    /**
     * 删除项目
     */
    @Transactional
    public void deleteProject(String projectId, String userId) {
        MallProject project = projectMapper.selectById(projectId);
        if (project == null || project.getIsDeleted()) {
            throw new BusinessException(ResultCode.NOT_FOUND, "项目不存在");
        }
        
        // 检查权限
        if (!project.getCreatorId().equals(userId)) {
            throw new BusinessException(ResultCode.FORBIDDEN, "无权删除此项目");
        }
        
        // 软删除楼层和区域
        deleteFloorsAndAreas(projectId);
        
        // 软删除项目（必须校验影响行数，避免出现“子数据已删但项目未删”的半成功状态）
        int affected = projectMapper.deleteById(projectId);
        if (affected <= 0) {
            throw new BusinessException(ResultCode.CONFLICT, "项目删除失败，请重试");
        }
    }
    
    // ==================== 私有方法 ====================
    
    private void saveFloor(FloorDTO floorDTO, String projectId) {
        Floor floor = new Floor();
        floor.setFloorId(normalizeId(floorDTO.getFloorId()));
        floor.setProjectId(projectId);
        floor.setName(floorDTO.getName());
        floor.setLevel(floorDTO.getLevel());
        floor.setHeight(floorDTO.getHeight());
        floor.setShape(convertToMap(floorDTO.getShape()));
        floor.setInheritOutline(floorDTO.getInheritOutline());
        floor.setColor(floorDTO.getColor());
        floor.setVisible(floorDTO.getVisible());
        floor.setLocked(floorDTO.getLocked());
        floor.setSortOrder(floorDTO.getSortOrder());
        
        floorMapper.insert(floor);
        
        // 保存区域
        if (floorDTO.getAreas() != null) {
            for (AreaDTO areaDTO : floorDTO.getAreas()) {
                saveArea(areaDTO, floor.getFloorId());
            }
        }
    }
    
    private void saveArea(AreaDTO areaDTO, String floorId) {
        Area area = new Area();
        area.setAreaId(normalizeId(areaDTO.getAreaId()));
        area.setFloorId(floorId);
        area.setName(areaDTO.getName());
        area.setType(areaDTO.getType());
        area.setShape(convertToMap(areaDTO.getShape()));
        area.setColor(areaDTO.getColor());
        area.setProperties(areaDTO.getProperties());
        area.setMerchantId(areaDTO.getMerchantId());
        area.setRental(areaDTO.getRental());
        area.setVisible(areaDTO.getVisible());
        area.setLocked(areaDTO.getLocked());
        area.setDoors(areaDTO.getDoors());
        
        areaMapper.insert(area);
    }
    
    private void deleteFloorsAndAreas(String projectId) {
        // 获取所有楼层
        List<Floor> floors = getFloorsByProjectId(projectId);
        
        // 软删除每个楼层的区域
        for (Floor floor : floors) {
            areaMapper.softDeleteByFloorId(floor.getFloorId());
        }
        
        // 软删除楼层
        floorMapper.softDeleteByProjectId(projectId);
    }
    
    private List<Floor> getFloorsByProjectId(String projectId) {
        LambdaQueryWrapper<Floor> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Floor::getProjectId, projectId)
               .eq(Floor::getIsDeleted, false)
               .orderByAsc(Floor::getLevel);
        return floorMapper.selectList(wrapper);
    }
    
    private List<Area> getAreasByFloorId(String floorId) {
        LambdaQueryWrapper<Area> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Area::getFloorId, floorId)
               .eq(Area::getIsDeleted, false);
        return areaMapper.selectList(wrapper);
    }
    
    private int countFloors(String projectId) {
        LambdaQueryWrapper<Floor> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Floor::getProjectId, projectId)
               .eq(Floor::getIsDeleted, false);
        return Math.toIntExact(floorMapper.selectCount(wrapper));
    }
    
    private int countAreas(String projectId) {
        List<Floor> floors = getFloorsByProjectId(projectId);
        int count = 0;
        for (Floor floor : floors) {
            LambdaQueryWrapper<Area> wrapper = new LambdaQueryWrapper<>();
            wrapper.eq(Area::getFloorId, floor.getFloorId())
                   .eq(Area::getIsDeleted, false);
            count += Math.toIntExact(areaMapper.selectCount(wrapper));
        }
        return count;
    }
    
    @SuppressWarnings("unchecked")
    private Map<String, Object> convertToMap(Object obj) {
        if (obj == null) return null;
        return objectMapper.convertValue(obj, Map.class);
    }
    /**
     * 将存储的形状数据转换为 OutlineDTO
     * 兼容两种格式：
     * 1. GeoJSON: {"type":"Polygon","coordinates":[[[x1,y1],[x2,y2],...]]}
     * 2. 原生格式: {"vertices":[{"x":x1,"y":y1},...], "isClosed":true}
     */
    @SuppressWarnings("unchecked")
    private OutlineDTO convertToOutlineDTO(Object shapeData) {
        if (shapeData == null) return null;

        Map<String, Object> map;
        if (shapeData instanceof Map) {
            map = (Map<String, Object>) shapeData;
        } else {
            map = objectMapper.convertValue(shapeData, Map.class);
        }

        // 如果包含 coordinates 字段，说明是 GeoJSON 格式
        if (map.containsKey("coordinates")) {
            OutlineDTO dto = new OutlineDTO();
            List<List<List<Number>>> coordinates = (List<List<List<Number>>>) map.get("coordinates");
            if (coordinates != null && !coordinates.isEmpty()) {
                List<List<Number>> ring = coordinates.get(0);
                List<OutlineDTO.VertexDTO> vertices = new java.util.ArrayList<>();
                for (int i = 0; i < ring.size(); i++) {
                    // GeoJSON 闭合多边形首尾点相同，跳过最后一个重复点
                    if (i == ring.size() - 1 && ring.size() > 1
                            && ring.get(i).get(0).doubleValue() == ring.get(0).get(0).doubleValue()
                            && ring.get(i).get(1).doubleValue() == ring.get(0).get(1).doubleValue()) {
                        continue;
                    }
                    OutlineDTO.VertexDTO vertex = new OutlineDTO.VertexDTO();
                    vertex.setX(ring.get(i).get(0).doubleValue());
                    vertex.setY(ring.get(i).get(1).doubleValue());
                    vertices.add(vertex);
                }
                dto.setVertices(vertices);
                dto.setIsClosed(true);
            }
            return dto;
        }

        // 原生格式，直接转换
        return objectMapper.convertValue(map, OutlineDTO.class);
    }
    
    private String generateId() {
        return UUID.randomUUID().toString().replace("-", "").substring(0, 32);
    }

    /**
     * 规范化外部传入的 ID
     * 
     * 前端使用 crypto.randomUUID() 生成带连字符的 UUID（36字符），
     * 数据库字段为 VARCHAR(32)，需要去掉连字符并截断。
     * 如果传入为 null 则生成新 ID。
     */
    private String normalizeId(String externalId) {
        if (externalId == null || externalId.isBlank()) {
            return generateId();
        }
        String normalized = externalId.replace("-", "");
        return normalized.length() > 32 ? normalized.substring(0, 32) : normalized;
    }
    
    private ProjectResponse convertToResponse(MallProject project) {
        ProjectResponse response = new ProjectResponse();
        response.setProjectId(project.getProjectId());
        response.setName(project.getName());
        response.setDescription(project.getDescription());
        response.setOutline(convertToOutlineDTO(project.getOutline()));
        response.setSettings(objectMapper.convertValue(project.getSettings(), SettingsDTO.class));
        response.setVersion(project.getVersion());
        response.setCreatedAt(project.getCreateTime());
        response.setUpdatedAt(project.getUpdateTime());
        
        if (project.getFloors() != null) {
            response.setFloors(project.getFloors().stream()
                    .map(this::convertFloorToResponse)
                    .collect(Collectors.toList()));
        }
        
        return response;
    }
    
    private FloorResponse convertFloorToResponse(Floor floor) {
        FloorResponse response = new FloorResponse();
        response.setFloorId(floor.getFloorId());
        response.setName(floor.getName());
        response.setLevel(floor.getLevel());
        response.setHeight(floor.getHeight());
        response.setShape(convertToOutlineDTO(floor.getShape()));
        response.setInheritOutline(floor.getInheritOutline());
        response.setColor(floor.getColor());
        response.setVisible(floor.getVisible());
        response.setLocked(floor.getLocked());
        response.setSortOrder(floor.getSortOrder());
        
        if (floor.getAreas() != null) {
            response.setAreas(floor.getAreas().stream()
                    .map(this::convertAreaToResponse)
                    .collect(Collectors.toList()));
        }
        
        return response;
    }
    
    private AreaResponse convertAreaToResponse(Area area) {
        AreaResponse response = new AreaResponse();
        response.setAreaId(area.getAreaId());
        response.setName(area.getName());
        response.setType(area.getType());
        response.setShape(convertToOutlineDTO(area.getShape()));
        response.setColor(area.getColor());
        response.setProperties(area.getProperties());
        response.setMerchantId(area.getMerchantId());
        response.setRental(area.getRental());
        response.setVisible(area.getVisible());
        response.setLocked(area.getLocked());
        response.setDoors(area.getDoors());
        response.setStatus(area.getStatus() != null ? area.getStatus().getValue() : AreaStatus.AVAILABLE.getValue());
        return response;
    }
}
