package com.smartmall.application.service.navigation;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.smartmall.application.service.MallBuilderService;
import com.smartmall.domain.entity.Store;
import com.smartmall.infrastructure.mapper.StoreMapper;
import com.smartmall.interfaces.dto.mallbuilder.AreaResponse;
import com.smartmall.interfaces.dto.mallbuilder.FloorResponse;
import com.smartmall.interfaces.dto.mallbuilder.OutlineDTO;
import com.smartmall.interfaces.dto.mallbuilder.ProjectResponse;
import com.smartmall.interfaces.dto.navigation.NavigationPlanRequest;
import com.smartmall.interfaces.dto.navigation.NavigationPlanResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * 已发布商城路径规划服务
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PublishedNavigationService {

    private static final Set<String> VALID_TARGET_TYPES = Set.of("store", "area", "facility");

    private final MallBuilderService mallBuilderService;
    private final StoreMapper storeMapper;

    /**
     * key: projectId:updatedAt
     */
    private final Map<String, GraphSnapshot> graphCache = new ConcurrentHashMap<>();

    public NavigationPlanResponse plan(NavigationPlanRequest request) {
        if (request == null
                || isBlank(request.getTargetType())
                || isBlank(request.getTargetKeyword())
                || !VALID_TARGET_TYPES.contains(request.getTargetType().trim().toLowerCase())) {
            return NavigationPlanResponse.fail("INVALID_REQUEST", "请求参数无效，请检查 targetType/targetKeyword");
        }

        ProjectResponse published = mallBuilderService.getPublishedMall();
        if (published == null || published.getFloors() == null || published.getFloors().isEmpty()) {
            return NavigationPlanResponse.fail("PUBLISHED_NOT_FOUND", "暂无已发布商城数据，请先发布项目");
        }

        GraphSnapshot snapshot = getOrBuildGraph(published);
        if (snapshot.graph.nodes.isEmpty()) {
            return NavigationPlanResponse.fail("ROUTE_NOT_FOUND", "已发布模型缺少可导航节点");
        }

        TargetResolution target = resolveTarget(
                request.getTargetType().trim().toLowerCase(),
                request.getTargetKeyword().trim(),
                snapshot
        );
        if (target == null) {
            return NavigationPlanResponse.fail("TARGET_NOT_FOUND", "未找到相关目标，请尝试更具体关键词");
        }

        GraphNode source = resolveSourceNode(request, snapshot, target.targetNode);
        if (source == null) {
            return NavigationPlanResponse.fail("ROUTE_NOT_FOUND", "无法确定起点，请提供有效起点信息");
        }

        List<PathHop> hops = shortestPath(snapshot.graph, source.id, target.targetNode.id, snapshot.floorLevelMap);
        if (hops == null || hops.isEmpty()) {
            return NavigationPlanResponse.fail("ROUTE_NOT_FOUND", "已找到目标，但当前模型不可达，请检查走廊/门/楼层连接并重新发布");
        }

        NavigationPlanResponse.RouteData route = buildRouteData(hops, snapshot);
        NavigationPlanResponse.TargetData targetData = buildTargetData(target, snapshot);
        return NavigationPlanResponse.ok(route, targetData, snapshot.warnings);
    }

    private GraphSnapshot getOrBuildGraph(ProjectResponse project) {
        String cacheKey = project.getProjectId() + ":" + project.getUpdatedAt();
        GraphSnapshot cached = graphCache.get(cacheKey);
        if (cached != null) {
            return cached;
        }

        GraphSnapshot built = buildGraph(project);
        graphCache.put(cacheKey, built);
        if (graphCache.size() > 10) {
            Iterator<String> iterator = graphCache.keySet().iterator();
            if (iterator.hasNext()) {
                graphCache.remove(iterator.next());
            }
        }
        return built;
    }

    private GraphSnapshot buildGraph(ProjectResponse project) {
        GraphSnapshot snapshot = new GraphSnapshot();

        List<FloorResponse> floors = project.getFloors().stream()
                .filter(Objects::nonNull)
                .sorted(Comparator.comparing(f -> Optional.ofNullable(f.getLevel()).orElse(0)))
                .collect(Collectors.toList());

        Map<String, Double> floorYMap = buildFloorYMap(floors);
        Graph graph = new Graph();

        for (FloorResponse floor : floors) {
            String floorId = floor.getFloorId();
            if (isBlank(floorId)) {
                continue;
            }
            snapshot.floorNameMap.put(floorId, defaultString(floor.getName(), floorId));
            snapshot.floorLevelMap.put(floorId, Optional.ofNullable(floor.getLevel()).orElse(0));

            List<GraphNode> floorNodes = new ArrayList<>();
            if (floor.getAreas() != null) {
                for (AreaResponse area : floor.getAreas()) {
                    if (area == null || isBlank(area.getAreaId()) || area.getShape() == null) {
                        continue;
                    }
                    Point3 point = areaCenterToPoint(area.getShape(), floorId, floorYMap.getOrDefault(floorId, 0D));
                    if (point == null) {
                        continue;
                    }
                    GraphNode node = new GraphNode(
                            "area:" + area.getAreaId(),
                            floorId,
                            point.x,
                            point.y,
                            point.z,
                            defaultString(area.getName(), area.getAreaId()),
                            normalize(area.getType()),
                            area.getAreaId()
                    );
                    graph.addNode(node);
                    floorNodes.add(node);
                    snapshot.areaNodeByAreaId.put(area.getAreaId(), node);
                    snapshot.areaByAreaId.put(area.getAreaId(), area);
                }
            }

            connectFloorNodes(graph, floorNodes);
        }

        addVerticalConnections(project.getMetadata(), graph, snapshot, floorYMap);
        snapshot.graph = graph;
        return snapshot;
    }

    private Map<String, Double> buildFloorYMap(List<FloorResponse> floors) {
        Map<String, Double> floorY = new HashMap<>();
        double y = 0D;
        for (FloorResponse floor : floors) {
            if (!isBlank(floor.getFloorId())) {
                floorY.put(floor.getFloorId(), y);
            }
            y += toDouble(floor.getHeight(), 4D);
        }
        return floorY;
    }

    private void connectFloorNodes(Graph graph, List<GraphNode> nodes) {
        if (nodes.size() < 2) {
            return;
        }

        List<GraphNode> corridorNodes = nodes.stream()
                .filter(node -> "corridor".equals(node.areaType)
                        || "common".equals(node.areaType)
                        || "entrance".equals(node.areaType))
                .collect(Collectors.toList());

        if (corridorNodes.isEmpty()) {
            connectByNearest(graph, nodes, nodes, 3, "walk");
            return;
        }

        connectByNearest(graph, corridorNodes, corridorNodes, 3, "walk");
        for (GraphNode node : nodes) {
            if (corridorNodes.contains(node)) {
                continue;
            }
            connectByNearest(graph, List.of(node), corridorNodes, 2, "walk");
        }
    }

    private void connectByNearest(
            Graph graph,
            List<GraphNode> sources,
            List<GraphNode> candidates,
            int k,
            String transitionType
    ) {
        for (GraphNode src : sources) {
            candidates.stream()
                    .filter(c -> !src.id.equals(c.id))
                    .sorted(Comparator.comparingDouble(c -> planarDistance(src, c)))
                    .limit(k)
                    .forEach(dst -> {
                        double cost = Math.max(1D, planarDistance(src, dst));
                        graph.addUndirectedEdge(src.id, dst.id, cost, transitionType);
                    });
        }
    }

    @SuppressWarnings("unchecked")
    private void addVerticalConnections(
            Map<String, Object> metadata,
            Graph graph,
            GraphSnapshot snapshot,
            Map<String, Double> floorYMap
    ) {
        List<Map<String, Object>> rawConnections = extractVerticalConnections(metadata);
        if (rawConnections.isEmpty()) {
            snapshot.warnings.add("未配置垂直连接，跨楼层导航可能不可达");
            return;
        }

        for (Map<String, Object> raw : rawConnections) {
            String areaId = asString(raw.get("areaId"));
            String type = normalize(asString(raw.get("type")));
            String connectionId = defaultString(asString(raw.get("id")), UUID.randomUUID().toString().replace("-", ""));

            if (isBlank(areaId)) {
                continue;
            }
            GraphNode areaNode = snapshot.areaNodeByAreaId.get(areaId);
            if (areaNode == null) {
                snapshot.warnings.add("垂直连接引用的区域不存在: " + areaId);
                continue;
            }

            List<String> connectedFloors = asStringList(raw.get("connectedFloors")).stream()
                    .filter(snapshot.floorNameMap::containsKey)
                    .distinct()
                    .collect(Collectors.toList());
            if (connectedFloors.size() < 2) {
                continue;
            }

            List<GraphNode> verticalNodes = new ArrayList<>();
            for (String floorId : connectedFloors) {
                GraphNode verticalNode = new GraphNode(
                        "vc:" + connectionId + ":" + floorId,
                        floorId,
                        areaNode.x,
                        floorYMap.getOrDefault(floorId, areaNode.y),
                        areaNode.z,
                        defaultString(type, "vertical"),
                        type,
                        null
                );
                graph.addNode(verticalNode);
                verticalNodes.add(verticalNode);

                List<GraphNode> floorNodes = graph.nodes.values().stream()
                        .filter(n -> floorId.equals(n.floorId) && n.id.startsWith("area:"))
                        .collect(Collectors.toList());
                connectByNearest(graph, List.of(verticalNode), floorNodes, 3, "walk");
            }

            List<GraphNode> sortedByLevel = verticalNodes.stream()
                    .sorted(Comparator.comparingInt(n -> snapshot.floorLevelMap.getOrDefault(n.floorId, 0)))
                    .collect(Collectors.toList());

            if ("escalator".equals(type) || "stairs".equals(type)) {
                for (int i = 0; i < sortedByLevel.size() - 1; i++) {
                    GraphNode a = sortedByLevel.get(i);
                    GraphNode b = sortedByLevel.get(i + 1);
                    double cost = verticalCost(type, snapshot.floorLevelMap, a.floorId, b.floorId);
                    graph.addUndirectedEdge(a.id, b.id, cost, type);
                }
            } else {
                for (int i = 0; i < sortedByLevel.size(); i++) {
                    for (int j = i + 1; j < sortedByLevel.size(); j++) {
                        GraphNode a = sortedByLevel.get(i);
                        GraphNode b = sortedByLevel.get(j);
                        double cost = verticalCost(type, snapshot.floorLevelMap, a.floorId, b.floorId);
                        graph.addUndirectedEdge(a.id, b.id, cost, type);
                    }
                }
            }
        }
    }

    private List<Map<String, Object>> extractVerticalConnections(Map<String, Object> metadata) {
        if (metadata == null || metadata.isEmpty()) {
            return Collections.emptyList();
        }
        Object navigation = metadata.get("navigation");
        if (!(navigation instanceof Map<?, ?> navigationMap)) {
            return Collections.emptyList();
        }
        Object verticalConnections = navigationMap.get("verticalConnections");
        if (!(verticalConnections instanceof List<?> list)) {
            return Collections.emptyList();
        }

        List<Map<String, Object>> result = new ArrayList<>();
        for (Object item : list) {
            if (item instanceof Map<?, ?> mapItem) {
                Map<String, Object> converted = new HashMap<>();
                mapItem.forEach((k, v) -> {
                    if (k != null) {
                        converted.put(String.valueOf(k), v);
                    }
                });
                result.add(converted);
            }
        }
        return result;
    }

    private TargetResolution resolveTarget(String targetType, String keyword, GraphSnapshot snapshot) {
        if ("store".equals(targetType)) {
            return resolveStoreTarget(keyword, snapshot);
        }
        if ("area".equals(targetType)) {
            return resolveAreaTarget(keyword, snapshot, false);
        }
        return resolveAreaTarget(keyword, snapshot, true);
    }

    private TargetResolution resolveStoreTarget(String keyword, GraphSnapshot snapshot) {
        LambdaQueryWrapper<Store> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Store::getIsDeleted, false);

        List<Store> stores = storeMapper.selectList(wrapper);
        Store bestStore = null;
        int bestScore = -1;
        for (Store store : stores) {
            if (store == null || isBlank(store.getName()) || isBlank(store.getAreaId())) {
                continue;
            }
            GraphNode targetNode = snapshot.areaNodeByAreaId.get(store.getAreaId());
            if (targetNode == null) {
                continue;
            }
            int score = matchScore(keyword, store.getName());
            if (score > bestScore) {
                bestScore = score;
                bestStore = store;
            }
        }
        if (bestStore == null || bestScore < 0) {
            return null;
        }

        GraphNode targetNode = snapshot.areaNodeByAreaId.get(bestStore.getAreaId());
        if (targetNode == null) {
            return null;
        }
        return new TargetResolution(
                "store",
                bestStore.getStoreId(),
                defaultString(bestStore.getName(), bestStore.getStoreId()),
                bestStore.getAreaId(),
                targetNode
        );
    }

    private TargetResolution resolveAreaTarget(String keyword, GraphSnapshot snapshot, boolean facilityOnly) {
        AreaResponse bestArea = null;
        GraphNode bestNode = null;
        int bestScore = -1;

        for (Map.Entry<String, AreaResponse> entry : snapshot.areaByAreaId.entrySet()) {
            AreaResponse area = entry.getValue();
            if (area == null) {
                continue;
            }
            String areaType = normalize(area.getType());
            if (facilityOnly && !isFacilityType(areaType)) {
                continue;
            }
            int score = Math.max(matchScore(keyword, area.getName()), matchScore(keyword, areaType));
            if (score > bestScore) {
                GraphNode node = snapshot.areaNodeByAreaId.get(entry.getKey());
                if (node != null) {
                    bestScore = score;
                    bestArea = area;
                    bestNode = node;
                }
            }
        }

        if (bestArea == null || bestNode == null || bestScore < 0) {
            return null;
        }

        return new TargetResolution(
                facilityOnly ? "facility" : "area",
                bestArea.getAreaId(),
                defaultString(bestArea.getName(), bestArea.getAreaId()),
                bestArea.getAreaId(),
                bestNode
        );
    }

    private GraphNode resolveSourceNode(NavigationPlanRequest request, GraphSnapshot snapshot, GraphNode fallbackTargetNode) {
        Graph graph = snapshot.graph;

        String requestedFloorId = normalizeFloorId(request.getSourceFloorId(), snapshot.floorNameMap.keySet());
        NavigationPlanRequest.Position sourcePos = request.getSourcePosition();

        if (sourcePos != null && sourcePos.getX() != null && sourcePos.getZ() != null) {
            String floorId = requestedFloorId;
            if (isBlank(floorId)) {
                floorId = fallbackTargetNode.floorId;
            }
            return nearestNodeOnFloor(graph, floorId, sourcePos.getX(), sourcePos.getZ());
        }

        if (!isBlank(requestedFloorId)) {
            GraphNode node = firstNodeOnFloor(graph, requestedFloorId);
            if (node != null) {
                return node;
            }
        }

        return graph.nodes.values().stream()
                .sorted(Comparator
                        .comparingInt((GraphNode n) -> snapshot.floorLevelMap.getOrDefault(n.floorId, 0))
                        .thenComparing(n -> n.id))
                .findFirst()
                .orElse(null);
    }

    private List<PathHop> shortestPath(
            Graph graph,
            String startId,
            String endId,
            Map<String, Integer> floorLevelMap
    ) {
        if (!graph.nodes.containsKey(startId) || !graph.nodes.containsKey(endId)) {
            return Collections.emptyList();
        }

        Map<String, Double> gScore = new HashMap<>();
        Map<String, Double> fScore = new HashMap<>();
        Map<String, String> cameFrom = new HashMap<>();
        Map<String, String> cameByTransition = new HashMap<>();

        for (String nodeId : graph.nodes.keySet()) {
            gScore.put(nodeId, Double.POSITIVE_INFINITY);
            fScore.put(nodeId, Double.POSITIVE_INFINITY);
        }

        gScore.put(startId, 0D);
        fScore.put(startId, heuristic(graph.nodes.get(startId), graph.nodes.get(endId), floorLevelMap));

        PriorityQueue<QueueEntry> openSet = new PriorityQueue<>(Comparator.comparingDouble(e -> e.priority));
        openSet.offer(new QueueEntry(startId, fScore.get(startId)));

        Set<String> closed = new HashSet<>();

        while (!openSet.isEmpty()) {
            QueueEntry currentEntry = openSet.poll();
            String current = currentEntry.nodeId;
            if (closed.contains(current)) {
                continue;
            }
            if (endId.equals(current)) {
                return reconstructPath(graph, cameFrom, cameByTransition, endId);
            }
            closed.add(current);

            for (GraphEdge edge : graph.adjacency.getOrDefault(current, Collections.emptyList())) {
                if (closed.contains(edge.to)) {
                    continue;
                }
                double tentative = gScore.get(current) + edge.cost;
                if (tentative < gScore.getOrDefault(edge.to, Double.POSITIVE_INFINITY)) {
                    cameFrom.put(edge.to, current);
                    cameByTransition.put(edge.to, edge.transitionType);
                    gScore.put(edge.to, tentative);
                    double estimate = tentative + heuristic(graph.nodes.get(edge.to), graph.nodes.get(endId), floorLevelMap);
                    fScore.put(edge.to, estimate);
                    openSet.offer(new QueueEntry(edge.to, estimate));
                }
            }
        }
        return Collections.emptyList();
    }

    private List<PathHop> reconstructPath(
            Graph graph,
            Map<String, String> cameFrom,
            Map<String, String> cameByTransition,
            String endId
    ) {
        LinkedList<PathHop> result = new LinkedList<>();
        String current = endId;
        result.addFirst(new PathHop(graph.nodes.get(current), "walk"));

        while (cameFrom.containsKey(current)) {
            String prev = cameFrom.get(current);
            String transitionType = cameByTransition.getOrDefault(current, "walk");
            result.addFirst(new PathHop(graph.nodes.get(prev), transitionType));
            current = prev;
        }

        if (!result.isEmpty()) {
            result.getFirst().transitionType = "walk";
            for (int i = 1; i < result.size(); i++) {
                result.get(i).transitionType = result.get(i - 1).transitionType;
            }
        }
        return result;
    }

    private double heuristic(GraphNode a, GraphNode b, Map<String, Integer> floorLevelMap) {
        if (a == null || b == null) {
            return 0D;
        }
        double planar = Math.hypot(a.x - b.x, a.z - b.z);
        int la = floorLevelMap.getOrDefault(a.floorId, 0);
        int lb = floorLevelMap.getOrDefault(b.floorId, 0);
        return planar + Math.abs(la - lb) * 6D;
    }

    private NavigationPlanResponse.RouteData buildRouteData(List<PathHop> hops, GraphSnapshot snapshot) {
        NavigationPlanResponse.RouteData route = new NavigationPlanResponse.RouteData();

        NavigationPlanResponse.RouteSegment currentSegment = null;
        double distance = 0D;
        List<String> steps = new ArrayList<>();
        List<NavigationPlanResponse.RouteTransition> transitions = new ArrayList<>();

        for (int i = 0; i < hops.size(); i++) {
            PathHop hop = hops.get(i);
            GraphNode node = hop.node;
            if (node == null) {
                continue;
            }

            if (currentSegment == null || !currentSegment.getFloorId().equals(node.floorId)) {
                currentSegment = new NavigationPlanResponse.RouteSegment();
                currentSegment.setFloorId(node.floorId);
                currentSegment.setFloorName(snapshot.floorNameMap.getOrDefault(node.floorId, node.floorId));
                route.getSegments().add(currentSegment);
            }
            currentSegment.getPoints().add(toRoutePoint(node));

            if (i > 0) {
                GraphNode prev = hops.get(i - 1).node;
                if (prev != null) {
                    distance += distance3d(prev, node);
                    if (!Objects.equals(prev.floorId, node.floorId)) {
                        NavigationPlanResponse.RouteTransition transition = new NavigationPlanResponse.RouteTransition();
                        transition.setFromFloorId(prev.floorId);
                        transition.setFromFloorName(snapshot.floorNameMap.getOrDefault(prev.floorId, prev.floorId));
                        transition.setToFloorId(node.floorId);
                        transition.setToFloorName(snapshot.floorNameMap.getOrDefault(node.floorId, node.floorId));
                        transition.setType(defaultString(hop.transitionType, "vertical"));
                        transition.setPosition(toRoutePoint(node));
                        transitions.add(transition);
                    }
                }
            }
        }

        if (!route.getSegments().isEmpty()) {
            NavigationPlanResponse.RouteSegment first = route.getSegments().get(0);
            steps.add("从 " + defaultString(first.getFloorName(), first.getFloorId()) + " 出发");
            for (NavigationPlanResponse.RouteTransition t : transitions) {
                steps.add("通过" + transitionTypeText(t.getType())
                        + "从 " + defaultString(t.getFromFloorName(), t.getFromFloorId())
                        + " 前往 " + defaultString(t.getToFloorName(), t.getToFloorId()));
            }
            NavigationPlanResponse.RouteSegment last = route.getSegments().get(route.getSegments().size() - 1);
            steps.add("到达 " + defaultString(last.getFloorName(), last.getFloorId()) + " 目标位置");
        }

        route.setTransitions(transitions);
        route.setSteps(steps);
        route.setDistance(round(distance));
        route.setEta(round(distance / 1.2D / 60D));
        return route;
    }

    private NavigationPlanResponse.TargetData buildTargetData(TargetResolution target, GraphSnapshot snapshot) {
        NavigationPlanResponse.TargetData data = new NavigationPlanResponse.TargetData();
        data.setTargetType(target.targetType);
        data.setTargetId(target.targetId);
        data.setTargetName(target.targetName);
        data.setAreaId(target.areaId);
        data.setFloorId(target.targetNode.floorId);
        data.setFloorName(snapshot.floorNameMap.getOrDefault(target.targetNode.floorId, target.targetNode.floorId));
        data.setPosition(toRoutePoint(target.targetNode));
        return data;
    }

    private NavigationPlanResponse.RoutePoint toRoutePoint(GraphNode node) {
        NavigationPlanResponse.RoutePoint point = new NavigationPlanResponse.RoutePoint();
        point.setFloorId(node.floorId);
        point.setX(round(node.x));
        point.setY(round(node.y));
        point.setZ(round(node.z));
        return point;
    }

    private GraphNode nearestNodeOnFloor(Graph graph, String floorId, double x, double z) {
        return graph.nodes.values().stream()
                .filter(node -> Objects.equals(node.floorId, floorId))
                .min(Comparator.comparingDouble(node -> Math.hypot(node.x - x, node.z - z)))
                .orElse(null);
    }

    private GraphNode firstNodeOnFloor(Graph graph, String floorId) {
        return graph.nodes.values().stream()
                .filter(node -> Objects.equals(node.floorId, floorId))
                .findFirst()
                .orElse(null);
    }

    private Point3 areaCenterToPoint(OutlineDTO outline, String floorId, double floorY) {
        if (outline == null || outline.getVertices() == null || outline.getVertices().isEmpty()) {
            return null;
        }
        double sumX = 0D;
        double sumY = 0D;
        int count = 0;
        for (OutlineDTO.VertexDTO vertex : outline.getVertices()) {
            if (vertex == null || vertex.getX() == null || vertex.getY() == null) {
                continue;
            }
            sumX += vertex.getX();
            sumY += vertex.getY();
            count++;
        }
        if (count == 0) {
            return null;
        }

        double cx = sumX / count;
        double cz = -(sumY / count);
        return new Point3(floorId, cx, floorY, cz);
    }

    private double verticalCost(String type, Map<String, Integer> floorLevelMap, String fromFloorId, String toFloorId) {
        int a = floorLevelMap.getOrDefault(fromFloorId, 0);
        int b = floorLevelMap.getOrDefault(toFloorId, 0);
        int levelDiff = Math.abs(a - b);
        double weight;
        if ("elevator".equals(type)) {
            weight = 4D;
        } else if ("escalator".equals(type)) {
            weight = 5D;
        } else {
            weight = 6D;
        }
        return Math.max(1D, levelDiff * 6D + weight);
    }

    private boolean isFacilityType(String areaType) {
        return Set.of("elevator", "escalator", "stairs", "restroom", "service", "facility").contains(areaType);
    }

    private int matchScore(String keyword, String text) {
        if (isBlank(keyword) || isBlank(text)) {
            return -1;
        }
        String k = normalize(keyword);
        String t = normalize(text);
        if (t.equals(k)) {
            return 1000;
        }
        if (t.contains(k)) {
            return 700 - (t.length() - k.length());
        }
        if (k.contains(t)) {
            return 500 - (k.length() - t.length());
        }
        return -1;
    }

    private String transitionTypeText(String type) {
        if ("elevator".equals(type)) {
            return "电梯";
        }
        if ("escalator".equals(type)) {
            return "扶梯";
        }
        if ("stairs".equals(type)) {
            return "楼梯";
        }
        return "通道";
    }

    private String normalizeFloorId(String floorId, Set<String> availableFloorIds) {
        if (isBlank(floorId)) {
            return null;
        }
        if (availableFloorIds.contains(floorId)) {
            return floorId;
        }
        return null;
    }

    private double planarDistance(GraphNode a, GraphNode b) {
        return Math.hypot(a.x - b.x, a.z - b.z);
    }

    private double distance3d(GraphNode a, GraphNode b) {
        return Math.sqrt(
                Math.pow(a.x - b.x, 2)
                        + Math.pow(a.y - b.y, 2)
                        + Math.pow(a.z - b.z, 2)
        );
    }

    private double toDouble(BigDecimal value, double defaultValue) {
        if (value == null) {
            return defaultValue;
        }
        return value.doubleValue();
    }

    private double round(double value) {
        return Math.round(value * 100D) / 100D;
    }

    private String normalize(String value) {
        if (value == null) {
            return "";
        }
        return value.trim().toLowerCase();
    }

    private boolean isBlank(String text) {
        return text == null || text.trim().isEmpty();
    }

    private String asString(Object obj) {
        return obj == null ? null : String.valueOf(obj);
    }

    private List<String> asStringList(Object obj) {
        if (!(obj instanceof List<?> list)) {
            return Collections.emptyList();
        }
        List<String> result = new ArrayList<>();
        for (Object item : list) {
            if (item != null) {
                result.add(String.valueOf(item));
            }
        }
        return result;
    }

    private String defaultString(String text, String fallback) {
        return isBlank(text) ? fallback : text;
    }

    private static class GraphSnapshot {
        private Graph graph = new Graph();
        private final Map<String, String> floorNameMap = new HashMap<>();
        private final Map<String, Integer> floorLevelMap = new HashMap<>();
        private final Map<String, GraphNode> areaNodeByAreaId = new HashMap<>();
        private final Map<String, AreaResponse> areaByAreaId = new HashMap<>();
        private final List<String> warnings = new ArrayList<>();
    }

    private static class Graph {
        private final Map<String, GraphNode> nodes = new HashMap<>();
        private final Map<String, List<GraphEdge>> adjacency = new HashMap<>();

        void addNode(GraphNode node) {
            nodes.put(node.id, node);
            adjacency.putIfAbsent(node.id, new ArrayList<>());
        }

        void addUndirectedEdge(String a, String b, double cost, String transitionType) {
            if (!nodes.containsKey(a) || !nodes.containsKey(b) || a.equals(b)) {
                return;
            }
            adjacency.get(a).add(new GraphEdge(b, cost, transitionType));
            adjacency.get(b).add(new GraphEdge(a, cost, transitionType));
        }
    }

    private static class GraphNode {
        private final String id;
        private final String floorId;
        private final double x;
        private final double y;
        private final double z;
        private final String label;
        private final String areaType;
        private final String areaId;

        private GraphNode(String id, String floorId, double x, double y, double z, String label, String areaType, String areaId) {
            this.id = id;
            this.floorId = floorId;
            this.x = x;
            this.y = y;
            this.z = z;
            this.label = label;
            this.areaType = areaType;
            this.areaId = areaId;
        }
    }

    private static class GraphEdge {
        private final String to;
        private final double cost;
        private final String transitionType;

        private GraphEdge(String to, double cost, String transitionType) {
            this.to = to;
            this.cost = cost;
            this.transitionType = transitionType;
        }
    }

    private static class QueueEntry {
        private final String nodeId;
        private final double priority;

        private QueueEntry(String nodeId, double priority) {
            this.nodeId = nodeId;
            this.priority = priority;
        }
    }

    private static class Point3 {
        private final String floorId;
        private final double x;
        private final double y;
        private final double z;

        private Point3(String floorId, double x, double y, double z) {
            this.floorId = floorId;
            this.x = x;
            this.y = y;
            this.z = z;
        }
    }

    private static class PathHop {
        private final GraphNode node;
        private String transitionType;

        private PathHop(GraphNode node, String transitionType) {
            this.node = node;
            this.transitionType = transitionType;
        }
    }

    private static class TargetResolution {
        private final String targetType;
        private final String targetId;
        private final String targetName;
        private final String areaId;
        private final GraphNode targetNode;

        private TargetResolution(String targetType, String targetId, String targetName, String areaId, GraphNode targetNode) {
            this.targetType = targetType;
            this.targetId = targetId;
            this.targetName = targetName;
            this.areaId = areaId;
            this.targetNode = targetNode;
        }
    }

}
