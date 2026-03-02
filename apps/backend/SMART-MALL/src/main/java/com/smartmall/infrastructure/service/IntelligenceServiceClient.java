package com.smartmall.infrastructure.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartmall.common.exception.BusinessException;
import com.smartmall.common.response.ResultCode;
import com.smartmall.interfaces.dto.ai.AiChatResponse;
import com.smartmall.interfaces.dto.merchant.StoreLayoutResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.io.BufferedInputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.*;

/**
 * Intelligence Service 客户端
 *
 * 职责：认证信息提取、协议转换（camelCase↔snake_case）、错误隔离。
 * 不进行任何业务逻辑分发，Python AgentExecutor 为唯一决策大脑。
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class IntelligenceServiceClient {

    private final RestTemplate intelligenceRestTemplate;
    private final ObjectMapper objectMapper;

    @Value("${intelligence.service.url:http://localhost:19191}")
    private String baseUrl;

    /**
     * 发送聊天消息到 Intelligence Service
     *
     * 职责：认证信息提取、协议转换（camelCase→snake_case）、错误隔离
     */
    public AiChatResponse chat(String userId, String userRole, String message, String imageUrl,
                               String currentPage, String currentFloor,
                               Double posX, Double posY, Double posZ) {
        String requestId = generateRequestId();

        try {
            // 1. 构建 Python ChatRequest（snake_case 字段）
            Map<String, Object> request = buildChatRequest(
                requestId, userId, userRole, message, imageUrl, currentFloor, posX, posY, posZ
            );

            // 2. 转发到 /api/chat
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);

            String url = baseUrl + "/api/chat";
            log.info("[{}] Sending chat request to Intelligence Service: {}", requestId, message);

            ResponseEntity<JsonNode> response = intelligenceRestTemplate.exchange(
                url, HttpMethod.POST, entity, JsonNode.class
            );

            // 3. 透传映射 → AiChatResponse
            return mapChatResponse(response.getBody(), requestId);

        } catch (RestClientException e) {
            log.error("[{}] Intelligence Service 调用失败: {}", requestId, e.getMessage());
            return createErrorResponse(requestId, "AI 服务暂时不可用，请稍后重试");
        } catch (Exception e) {
            log.error("[{}] 未知错误: {}", requestId, e.getMessage(), e);
            return createErrorResponse(requestId, "处理请求时发生错误");
        }
    }

    /**
     * 确认操作
     */
    public AiChatResponse confirm(String userId, String action, Map<String, Object> args, boolean confirmed) {
        String requestId = generateRequestId();

        try {
            Map<String, Object> request = new HashMap<>();
            request.put("request_id", requestId);
            request.put("user_id", userId);
            request.put("action", action);
            request.put("args", args);
            request.put("confirmed", confirmed);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);

            String url = baseUrl + "/api/chat/confirm";
            log.info("[{}] Sending confirm request: action={}, confirmed={}", requestId, action, confirmed);

            ResponseEntity<JsonNode> response = intelligenceRestTemplate.exchange(
                url, HttpMethod.POST, entity, JsonNode.class
            );

            return mapChatResponse(response.getBody(), requestId);

        } catch (RestClientException e) {
            log.error("[{}] Intelligence Service 调用失败: {}", requestId, e.getMessage());
            return createErrorResponse(requestId, "AI 服务暂时不可用，请稍后重试");
        } catch (Exception e) {
            log.error("[{}] 未知错误: {}", requestId, e.getMessage(), e);
            return createErrorResponse(requestId, "处理请求时发生错误");
        }
    }

    /**
     * 代理 SSE 聊天流到输出流。
     */
    public void streamChat(
            String userId,
            String userRole,
            String message,
            String imageUrl,
            String currentPage,
            String currentFloor,
            Double posX,
            Double posY,
            Double posZ,
            OutputStream outputStream
    ) throws IOException {
        String requestId = generateRequestId();
        Map<String, Object> request = buildChatRequest(
            requestId, userId, userRole, message, imageUrl, currentFloor, posX, posY, posZ
        );

        HttpURLConnection connection = null;
        try {
            URL url = new URL(baseUrl + "/api/chat/stream");
            connection = (HttpURLConnection) url.openConnection();
            connection.setRequestMethod("POST");
            connection.setDoOutput(true);
            connection.setConnectTimeout(10_000);
            connection.setReadTimeout(0); // SSE 长连接
            connection.setRequestProperty("Content-Type", "application/json");
            connection.setRequestProperty("Accept", "text/event-stream");

            byte[] body = objectMapper.writeValueAsBytes(request);
            connection.getOutputStream().write(body);
            connection.getOutputStream().flush();

            int code = connection.getResponseCode();
            if (code >= 400) {
                String err = "data: {\"error\":\"AI 服务流式接口不可用\"}\n\n";
                outputStream.write(err.getBytes(StandardCharsets.UTF_8));
                outputStream.flush();
                return;
            }

            try (BufferedInputStream in = new BufferedInputStream(connection.getInputStream())) {
                byte[] buffer = new byte[1024];
                int len;
                while ((len = in.read(buffer)) != -1) {
                    outputStream.write(buffer, 0, len);
                    outputStream.flush();
                }
            }
        } catch (Exception e) {
            String err = "data: {\"error\":\"AI 服务暂时不可用，请稍后再试\"}\n\n";
            outputStream.write(err.getBytes(StandardCharsets.UTF_8));
            outputStream.flush();
            log.error("[{}] stream chat failed: {}", requestId, e.getMessage());
        } finally {
            if (connection != null) {
                connection.disconnect();
            }
        }
    }

    /**
     * 健康检查
     */
    public boolean healthCheck() {
        try {
            String url = baseUrl + "/health";
            ResponseEntity<JsonNode> response = intelligenceRestTemplate.getForEntity(url, JsonNode.class);
            return response.getStatusCode().is2xxSuccessful();
        } catch (Exception e) {
            log.warn("Intelligence Service health check failed: {}", e.getMessage());
            return false;
        }
    }

    /**
     * 透传映射 Python ChatResponse 到 Java AiChatResponse
     *
     * 将 Python snake_case 字段映射为 Java camelCase 字段，不进行任何业务逻辑分发。
     */
    AiChatResponse mapChatResponse(JsonNode json, String requestId) {
        AiChatResponse response = new AiChatResponse();
        response.setRequestId(requestId);

        if (json == null) {
            response.setType("error");
            response.setContent("AI 服务返回空响应");
            response.setTimestamp(Instant.now().toString());
            return response;
        }

        // 直接映射字段
        response.setType(json.path("type").asText("text"));
        response.setContent(json.path("content").asText(null));
        response.setMessage(json.path("message").asText(null));
        response.setAction(json.path("action").asText(null));
        response.setTimestamp(json.path("timestamp").asText(Instant.now().toString()));
        if (!json.path("rag_used").isMissingNode()) {
            response.setRagUsed(json.path("rag_used").asBoolean(false));
        }
        response.setRetrievalStrategy(json.path("retrieval_strategy").asText(null));

        // 映射 args（Map<String, Object>）
        JsonNode argsNode = json.path("args");
        if (argsNode.isObject()) {
            response.setArgs(objectMapper.convertValue(argsNode, Map.class));
        }

        // 映射 tool_results → toolResults（List<ToolResult>）
        JsonNode toolResultsNode = json.path("tool_results");
        if (toolResultsNode.isArray()) {
            List<AiChatResponse.ToolResult> toolResults = new ArrayList<>();
            for (JsonNode trNode : toolResultsNode) {
                AiChatResponse.ToolResult tr = new AiChatResponse.ToolResult();
                tr.setFunction(trNode.path("function").asText(null));

                JsonNode trArgsNode = trNode.path("args");
                if (trArgsNode.isObject()) {
                    tr.setArgs(objectMapper.convertValue(trArgsNode, Map.class));
                }

                JsonNode trResultNode = trNode.path("result");
                if (trResultNode.isObject()) {
                    tr.setResult(objectMapper.convertValue(trResultNode, Map.class));
                }

                toolResults.add(tr);
            }
            response.setToolResults(toolResults);
        }

        JsonNode evidenceNode = json.path("evidence");
        if (evidenceNode.isArray()) {
            List<AiChatResponse.EvidenceItem> evidences = new ArrayList<>();
            for (JsonNode evNode : evidenceNode) {
                AiChatResponse.EvidenceItem ev = new AiChatResponse.EvidenceItem();
                ev.setId(evNode.path("id").asText(null));
                ev.setSourceType(evNode.path("source_type").asText(null));
                ev.setSourceCollection(evNode.path("source_collection").asText(null));
                if (!evNode.path("score").isMissingNode() && evNode.path("score").isNumber()) {
                    ev.setScore(evNode.path("score").asDouble());
                }
                ev.setSnippet(evNode.path("snippet").asText(null));
                evidences.add(ev);
            }
            response.setEvidence(evidences);
        }

        return response;
    }

    /**
     * 创建错误响应
     */
    AiChatResponse createErrorResponse(String requestId, String message) {
        AiChatResponse response = new AiChatResponse();
        response.setRequestId(requestId);
        response.setType("error");
        response.setContent(message);
        response.setRagUsed(false);
        response.setRetrievalStrategy("error");
        response.setTimestamp(Instant.now().toString());
        return response;
    }

    /**
     * 生成请求 ID
     */
    String generateRequestId() {
        return "req_" + System.currentTimeMillis() + "_" +
               UUID.randomUUID().toString().substring(0, 8);
    }

    /**
     * 构建 Python ChatRequest 请求体（提取为可测试方法）
     */
    Map<String, Object> buildChatRequest(String requestId, String userId, String userRole,
                                          String message, String imageUrl, String currentFloor,
                                          Double posX, Double posY, Double posZ) {
        Map<String, Object> request = new HashMap<>();
        request.put("request_id", requestId);
        request.put("user_id", userId);
        request.put("message", message);
        request.put("image_url", imageUrl);

        Map<String, Object> context = new HashMap<>();
        context.put("user_role", userRole);
        context.put("current_floor", currentFloor);
        if (posX != null && posY != null && posZ != null) {
            context.put("position", Map.of("x", posX, "y", posY, "z", posZ));
        }
        request.put("context", context);

        return request;
    }

    /**
     * 调用 Intelligence Service 生成店铺布局
     *
     * @param theme         店铺主题
     * @param areaId        区域 ID
     * @param areaBoundary  区域边界顶点列表
     * @return StoreLayoutResponse
     * @throws BusinessException 当 Intelligence Service 不可用或超时时
     */
    public StoreLayoutResponse generateStoreLayout(
            String theme,
            String areaId,
            List<Map<String, Object>> areaBoundary) {
        String url = baseUrl + "/api/store/generate-layout";
        log.info("调用 Intelligence Service 生成店铺布局: areaId={}, theme={}", areaId, theme);

        try {
            Map<String, Object> request = new HashMap<>();
            request.put("theme", theme);
            request.put("areaId", areaId);
            request.put("areaBoundary", areaBoundary);
            request.put("availableMaterials", List.of());

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);

            ResponseEntity<StoreLayoutResponse> response = intelligenceRestTemplate.exchange(
                    url, HttpMethod.POST, entity, StoreLayoutResponse.class
            );

            StoreLayoutResponse body = response.getBody();
            if (body == null) {
                log.error("Intelligence Service 返回空响应: areaId={}", areaId);
                throw new BusinessException(ResultCode.EXTERNAL_SERVICE_ERROR, "AI 服务返回空响应，请稍后重试");
            }

            log.info("AI 布局生成完成: areaId={}, success={}", areaId, body.getSuccess());
            return body;

        } catch (ResourceAccessException e) {
            log.error("Intelligence Service 超时或不可达: areaId={}, error={}", areaId, e.getMessage());
            throw new BusinessException(ResultCode.EXTERNAL_SERVICE_TIMEOUT, "AI 服务超时，请稍后重试");
        } catch (RestClientException e) {
            log.error("Intelligence Service 调用失败: areaId={}, error={}", areaId, e.getMessage());
            throw new BusinessException(ResultCode.EXTERNAL_SERVICE_ERROR, "AI 服务暂时不可用，请稍后重试");
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("调用 Intelligence Service 时发生未知错误: areaId={}", areaId, e);
            throw new BusinessException(ResultCode.EXTERNAL_SERVICE_ERROR, "AI 服务异常，请稍后重试");
        }
    }
}
