package com.smartmall.application.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartmall.common.exception.BusinessException;
import com.smartmall.common.response.ResultCode;
import com.smartmall.domain.entity.Area;
import com.smartmall.domain.entity.Floor;
import com.smartmall.domain.entity.MallProject;
import com.smartmall.infrastructure.mapper.AreaMapper;
import com.smartmall.infrastructure.mapper.FloorMapper;
import com.smartmall.infrastructure.mapper.MallProjectMapper;
import com.smartmall.interfaces.dto.mallbuilder.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
        
        // 软删除项目
        project.setIsDeleted(true);
        projectMapper.updateById(project);
    }
    
    // ==================== 私有方法 ====================
    
    private void saveFloor(FloorDTO floorDTO, String projectId) {
        Floor floor = new Floor();
        floor.setFloorId(floorDTO.getFloorId() != null ? floorDTO.getFloorId() : generateId());
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
        area.setAreaId(areaDTO.getAreaId() != null ? areaDTO.getAreaId() : generateId());
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
    
    private String generateId() {
        return UUID.randomUUID().toString().replace("-", "").substring(0, 32);
    }
    
    private ProjectResponse convertToResponse(MallProject project) {
        ProjectResponse response = new ProjectResponse();
        response.setProjectId(project.getProjectId());
        response.setName(project.getName());
        response.setDescription(project.getDescription());
        response.setOutline(objectMapper.convertValue(project.getOutline(), OutlineDTO.class));
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
        response.setShape(objectMapper.convertValue(floor.getShape(), OutlineDTO.class));
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
        response.setShape(objectMapper.convertValue(area.getShape(), OutlineDTO.class));
        response.setColor(area.getColor());
        response.setProperties(area.getProperties());
        response.setMerchantId(area.getMerchantId());
        response.setRental(area.getRental());
        response.setVisible(area.getVisible());
        response.setLocked(area.getLocked());
        return response;
    }
}
