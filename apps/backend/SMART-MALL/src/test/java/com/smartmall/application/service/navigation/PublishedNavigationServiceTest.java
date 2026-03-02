package com.smartmall.application.service.navigation;

import com.smartmall.application.service.MallBuilderService;
import com.smartmall.infrastructure.mapper.StoreMapper;
import com.smartmall.interfaces.dto.mallbuilder.AreaResponse;
import com.smartmall.interfaces.dto.mallbuilder.FloorResponse;
import com.smartmall.interfaces.dto.mallbuilder.OutlineDTO;
import com.smartmall.interfaces.dto.mallbuilder.ProjectResponse;
import com.smartmall.interfaces.dto.navigation.NavigationPlanRequest;
import com.smartmall.interfaces.dto.navigation.NavigationPlanResponse;
import com.smartmall.application.service.navigation.NavigationDynamicEventService;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class PublishedNavigationServiceTest {

    @Test
    void planShouldIncludeTransitionConnectionFields() {
        MallBuilderService mallBuilderService = mock(MallBuilderService.class);
        StoreMapper storeMapper = mock(StoreMapper.class);
        NavigationDynamicEventService dynamicEventService = mock(NavigationDynamicEventService.class);
        when(dynamicEventService.listActiveEvents(org.mockito.ArgumentMatchers.anyString(), org.mockito.ArgumentMatchers.any()))
                .thenReturn(List.of());
        when(dynamicEventService.buildDynamicVersion(org.mockito.ArgumentMatchers.anyString(), org.mockito.ArgumentMatchers.anyList()))
                .thenReturn("disabled");
        PublishedNavigationService service = new PublishedNavigationService(mallBuilderService, storeMapper, dynamicEventService);

        ProjectResponse project = buildProject();
        when(mallBuilderService.getPublishedMall()).thenReturn(project);

        NavigationPlanRequest request = new NavigationPlanRequest();
        request.setTargetType("area");
        request.setTargetKeyword("Nike");
        request.setSourceFloorId("f1");

        NavigationPlanResponse response = service.plan(request);
        assertTrue(response.isSuccess(), "规划应成功");
        assertNotNull(response.getRoute(), "应返回 route");
        assertFalse(response.getRoute().getTransitions().isEmpty(), "应存在跨层 transition");

        NavigationPlanResponse.RouteTransition transition = response.getRoute().getTransitions().get(0);
        assertEquals("vc001", transition.getConnectionId());
        assertEquals("stairs-area", transition.getConnectionAreaId());
        assertNotNull(transition.getType());
        assertFalse(transition.getType().isBlank());
    }

    private ProjectResponse buildProject() {
        ProjectResponse project = new ProjectResponse();
        project.setProjectId("project-1");
        project.setUpdatedAt(LocalDateTime.now());
        project.setFloors(List.of(
                buildFloor("f1", "1F", 1, List.of(
                        buildArea("stairs-area", "主楼梯", "stairs", rect(2, 2, 2, 2)),
                        buildArea("c1", "走廊1", "corridor", rect(0, 0, 10, 10))
                )),
                buildFloor("f2", "2F", 2, List.of(
                        buildArea("c2", "走廊2", "corridor", rect(0, 0, 10, 10)),
                        buildArea("nike-area", "Nike", "retail", rect(7, 7, 2, 2))
                ))
        ));
        project.setMetadata(buildNavigationMetadata());
        return project;
    }

    private FloorResponse buildFloor(String id, String name, int level, List<AreaResponse> areas) {
        FloorResponse floor = new FloorResponse();
        floor.setFloorId(id);
        floor.setName(name);
        floor.setLevel(level);
        floor.setHeight(BigDecimal.valueOf(4));
        floor.setVisible(true);
        floor.setLocked(false);
        floor.setAreas(areas);
        return floor;
    }

    private AreaResponse buildArea(String areaId, String name, String type, OutlineDTO shape) {
        AreaResponse area = new AreaResponse();
        area.setAreaId(areaId);
        area.setName(name);
        area.setType(type);
        area.setShape(shape);
        area.setVisible(true);
        area.setLocked(false);
        return area;
    }

    private OutlineDTO rect(double x, double y, double w, double h) {
        OutlineDTO outline = new OutlineDTO();
        List<OutlineDTO.VertexDTO> vertices = new ArrayList<>();
        vertices.add(vertex(x, y));
        vertices.add(vertex(x + w, y));
        vertices.add(vertex(x + w, y + h));
        vertices.add(vertex(x, y + h));
        outline.setVertices(vertices);
        outline.setIsClosed(true);
        return outline;
    }

    private OutlineDTO.VertexDTO vertex(double x, double y) {
        OutlineDTO.VertexDTO vertex = new OutlineDTO.VertexDTO();
        vertex.setX(x);
        vertex.setY(y);
        return vertex;
    }

    private Map<String, Object> buildNavigationMetadata() {
        Map<String, Object> connection = new HashMap<>();
        connection.put("id", "vc001");
        connection.put("areaId", "stairs-area");
        connection.put("type", "stairs");
        connection.put("connectedFloors", List.of("f1", "f2"));

        Map<String, Object> navigation = new HashMap<>();
        navigation.put("verticalConnections", List.of(connection));

        Map<String, Object> metadata = new HashMap<>();
        metadata.put("navigation", navigation);
        return metadata;
    }
}
