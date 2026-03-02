package com.smartmall.application.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartmall.common.exception.BusinessException;
import com.smartmall.common.response.ResultCode;
import com.smartmall.domain.entity.MallProject;
import com.smartmall.infrastructure.mapper.AreaMapper;
import com.smartmall.infrastructure.mapper.FloorMapper;
import com.smartmall.infrastructure.mapper.MallProjectMapper;
import com.smartmall.interfaces.dto.mallbuilder.AreaDTO;
import com.smartmall.interfaces.dto.mallbuilder.CreateProjectRequest;
import com.smartmall.interfaces.dto.mallbuilder.FloorDTO;
import com.smartmall.interfaces.dto.mallbuilder.OutlineDTO;
import com.smartmall.interfaces.dto.mallbuilder.UpdateProjectRequest;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class MallBuilderServiceTest {

    private final MallProjectMapper projectMapper = mock(MallProjectMapper.class);
    private final FloorMapper floorMapper = mock(FloorMapper.class);
    private final AreaMapper areaMapper = mock(AreaMapper.class);
    private final MallBuilderService service = new MallBuilderService(projectMapper, floorMapper, areaMapper, new ObjectMapper());

    @Test
    void createProjectShouldRejectTransitOverlap() {
        CreateProjectRequest request = new CreateProjectRequest();
        request.setName("demo");
        request.setOutline(rect(0, 0, 100, 100));
        request.setFloors(List.of(buildFloor("1F", List.of(
                buildArea("主楼梯", "stairs", rect(0, 0, 4, 4)),
                buildArea("服饰区", "retail", rect(2, 2, 4, 4))
        ))));

        BusinessException exception = assertThrows(BusinessException.class, () -> service.createProject(request, "u1"));
        assertEquals(ResultCode.PARAM_ERROR.getCode(), exception.getCode());
        verify(projectMapper, never()).insert(any(MallProject.class));
    }

    @Test
    void updateProjectShouldRejectTransitOverlap() {
        MallProject existing = new MallProject();
        existing.setProjectId("p1");
        existing.setCreatorId("u1");
        existing.setIsDeleted(false);
        existing.setVersion(3);
        when(projectMapper.selectById("p1")).thenReturn(existing);

        UpdateProjectRequest request = new UpdateProjectRequest();
        request.setName("demo");
        request.setVersion(3);
        request.setOutline(rect(0, 0, 100, 100));
        request.setFloors(List.of(buildFloor("1F", List.of(
                buildArea("自动扶梯", "escalator", rect(10, 10, 3, 3)),
                buildArea("公共通道", "corridor", rect(11, 11, 4, 4))
        ))));

        BusinessException exception = assertThrows(BusinessException.class, () -> service.updateProject("p1", request, "u1"));
        assertEquals(ResultCode.PARAM_ERROR.getCode(), exception.getCode());
        verify(projectMapper, never()).updateById(any(MallProject.class));
    }

    private FloorDTO buildFloor(String name, List<AreaDTO> areas) {
        FloorDTO floor = new FloorDTO();
        floor.setFloorId("f-" + name);
        floor.setName(name);
        floor.setLevel(1);
        floor.setAreas(areas);
        return floor;
    }

    private AreaDTO buildArea(String name, String type, OutlineDTO shape) {
        AreaDTO area = new AreaDTO();
        area.setAreaId("a-" + name);
        area.setName(name);
        area.setType(type);
        area.setShape(shape);
        return area;
    }

    private OutlineDTO rect(double x, double y, double width, double height) {
        OutlineDTO outline = new OutlineDTO();
        outline.setVertices(List.of(
                vertex(x, y),
                vertex(x + width, y),
                vertex(x + width, y + height),
                vertex(x, y + height)
        ));
        outline.setIsClosed(true);
        return outline;
    }

    private OutlineDTO.VertexDTO vertex(double x, double y) {
        OutlineDTO.VertexDTO vertex = new OutlineDTO.VertexDTO();
        vertex.setX(x);
        vertex.setY(y);
        return vertex;
    }
}

