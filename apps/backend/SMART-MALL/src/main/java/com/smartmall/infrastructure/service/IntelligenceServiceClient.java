package com.smartmall.infrastructure.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartmall.infrastructure.config.IntelligenceServiceConfig;
import com.smartmall.interfaces.dto.ai.AiChatResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.util.*;

/**
 * Intelligence Service 客户端
 * 
 * 负责与 Python AI 服务通信
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class IntelligenceServiceClient {
    
    private final RestTemplate intelligenceRestTemplate;
    private final ObjectMapper objectMapper;
    
    @Value("${intelligence.service.url:http://localhost:9001}")
    private String baseUrl;
    
    /**
     * 发送聊天消息到 Intelligence Service
     */
    public AiChatResponse chat(String userId, String userRole, String message, String imageUrl, 
                               String currentPage, String currentFloor,
                               Double posX, Double posY, Double posZ) {
        String requestId = generateRequestId();
        
        try {
            // 构建请求体
            Map<String, Object> request = new HashMap<>();
            request.put("requestId", requestId);
            request.put("version", "1.0");
            request.put("timestamp", Instant.now().toString());
            
            // 上下文
            Map<String, Object> context = new HashMap<>();
            context.put("userId", userId);
            context.put("role", userRole);
            context.put("currentPage", currentPage);
            if (posX != null && posY != null && posZ != null) {
                Map<String, Double> position = new HashMap<>();
                position.put("x", posX);
                position.put("y", posY);
                position.put("z", posZ);
                context.put("currentPosition", position);
            }
            request.put("context", context);
            
            // 输入
            Map<String, Object> input = new HashMap<>();
            input.put("type", "NATURAL_LANGUAGE");
            input.put("text", message);
            input.put("locale", "zh-CN");
            request.put("input", input);
            
            // 发送请求到 LLM 意图识别服务
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);
            
            String url = baseUrl + "/api/intent/process";
            log.info("[{}] Sending request to Intelligence Service: {}", requestId, message);
            
            ResponseEntity<JsonNode> response = intelligenceRestTemplate.exchange(
                url, HttpMethod.POST, entity, JsonNode.class
            );
            
            return parseIntentResponse(response.getBody(), requestId, message);
            
        } catch (RestClientException e) {
            log.error("[{}] Failed to call Intelligence Service: {}", requestId, e.getMessage());
            return createErrorResponse(requestId, "AI 服务暂时不可用，请稍后重试");
        } catch (Exception e) {
            log.error("[{}] Unexpected error: {}", requestId, e.getMessage(), e);
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
            
            return parseChatResponse(response.getBody(), requestId);
            
        } catch (RestClientException e) {
            log.error("[{}] Failed to call Intelligence Service: {}", requestId, e.getMessage());
            return createErrorResponse(requestId, "AI 服务暂时不可用，请稍后重试");
        } catch (Exception e) {
            log.error("[{}] Unexpected error: {}", requestId, e.getMessage(), e);
            return createErrorResponse(requestId, "处理请求时发生错误");
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
     * 解析意图响应
     */
    private AiChatResponse parseIntentResponse(JsonNode json, String requestId, String originalMessage) {
        AiChatResponse response = new AiChatResponse();
        response.setRequestId(requestId);
        response.setTimestamp(Instant.now().toString());
        
        if (json == null) {
            response.setType("error");
            response.setContent("AI 服务返回空响应");
            return response;
        }
        
        String status = json.path("status").asText("ERROR");
        
        if ("SUCCESS".equals(status)) {
            JsonNode result = json.path("result");
            String intent = result.path("intent").asText();
            double confidence = result.path("confidence").asDouble(0);
            
            response.setIntent(intent);
            response.setConfidence(confidence);
            
            // 解析响应文本
            JsonNode responseNode = result.path("response");
            response.setContent(responseNode.path("text").asText());
            
            // 解析建议
            JsonNode suggestions = responseNode.path("suggestions");
            if (suggestions.isArray()) {
                List<String> suggestionList = new ArrayList<>();
                suggestions.forEach(s -> suggestionList.add(s.asText()));
                response.setSuggestions(suggestionList);
            }
            
            // 解析 actions
            JsonNode actions = result.path("actions");
            log.info("[{}] Actions array: {}", requestId, actions);
            if (actions.isArray() && !actions.isEmpty()) {
                JsonNode firstAction = actions.get(0);
                String actionType = firstAction.path("action").asText();
                log.info("[{}] First action type: {}", requestId, actionType);
                
                if ("NAVIGATE_TO_PAGE".equals(actionType)) {
                    response.setType("navigate");
                    JsonNode target = firstAction.path("target");
                    response.setNavigateTo(target.path("id").asText());
                    JsonNode params = firstAction.path("params");
                    response.setNavigateLabel(params.path("label").asText());
                } else if ("GENERATE_MALL".equals(actionType)) {
                    // 调用商城生成 API
                    JsonNode params = firstAction.path("params");
                    String description = params.path("description").asText();
                    
                    // 如果 LLM 没有返回 description，使用原始用户输入
                    if (description == null || description.isEmpty()) {
                        log.warn("[{}] GENERATE_MALL action missing description in params, using original message", requestId);
                        description = originalMessage;
                    }
                    
                    log.info("[{}] Generating mall with description: {}", requestId, description);
                    return generateMallLayout(requestId, description);
                } else {
                    response.setType("text");
                    response.setAction(actionType);
                }
            } else {
                log.warn("[{}] No actions in response, setting type to text", requestId);
                response.setType("text");
            }
        } else {
            response.setType("error");
            JsonNode error = json.path("error");
            response.setContent(error.path("message").asText("AI 处理失败"));
        }
        
        return response;
    }
    
    /**
     * 解析聊天响应
     */
    private AiChatResponse parseChatResponse(JsonNode json, String requestId) {
        AiChatResponse response = new AiChatResponse();
        response.setRequestId(requestId);
        response.setTimestamp(Instant.now().toString());
        
        if (json == null) {
            response.setType("error");
            response.setContent("AI 服务返回空响应");
            return response;
        }
        
        response.setType(json.path("type").asText("text"));
        response.setContent(json.path("content").asText());
        response.setMessage(json.path("message").asText());
        response.setAction(json.path("action").asText(null));
        
        return response;
    }
    
    /**
     * 创建错误响应
     */
    private AiChatResponse createErrorResponse(String requestId, String message) {
        AiChatResponse response = new AiChatResponse();
        response.setRequestId(requestId);
        response.setType("error");
        response.setContent(message);
        response.setTimestamp(Instant.now().toString());
        return response;
    }
    
    /**
     * 生成请求 ID
     */
    private String generateRequestId() {
        return "req_" + System.currentTimeMillis() + "_" + 
               UUID.randomUUID().toString().substring(0, 8);
    }
    
    /**
     * 调用商城生成 API
     */
    private AiChatResponse generateMallLayout(String requestId, String description) {
        try {
            Map<String, Object> request = new HashMap<>();
            request.put("description", description);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);
            
            String url = baseUrl + "/api/mall/generate";
            log.info("[{}] Generating mall layout: {}", requestId, description);
            
            ResponseEntity<JsonNode> response = intelligenceRestTemplate.exchange(
                url, HttpMethod.POST, entity, JsonNode.class
            );
            
            return parseMallGenerateResponse(response.getBody(), requestId);
            
        } catch (RestClientException e) {
            log.error("[{}] Failed to generate mall: {}", requestId, e.getMessage());
            return createErrorResponse(requestId, "商城生成服务暂时不可用，请稍后重试");
        } catch (Exception e) {
            log.error("[{}] Unexpected error generating mall: {}", requestId, e.getMessage(), e);
            return createErrorResponse(requestId, "生成商城时发生错误");
        }
    }
    
    /**
     * 解析商城生成响应
     */
    private AiChatResponse parseMallGenerateResponse(JsonNode json, String requestId) {
        AiChatResponse response = new AiChatResponse();
        response.setRequestId(requestId);
        response.setTimestamp(Instant.now().toString());
        
        if (json == null) {
            response.setType("error");
            response.setContent("商城生成服务返回空响应");
            return response;
        }
        
        boolean success = json.path("success").asBoolean(false);
        String message = json.path("message").asText();
        
        if (success) {
            response.setType("mall_generated");
            response.setContent(message + "\n\n布局数据已生成，您可以在「商城建模」页面导入并编辑。");
            response.setAction("MALL_GENERATED");
            
            // 将生成的数据放入 args 中
            JsonNode data = json.path("data");
            if (!data.isMissingNode()) {
                Map<String, Object> args = new HashMap<>();
                args.put("mallData", objectMapper.convertValue(data, Map.class));
                args.put("parseInfo", objectMapper.convertValue(json.path("parseInfo"), Map.class));
                response.setArgs(args);
            }
            
            List<String> suggestions = new ArrayList<>();
            suggestions.add("打开商城建模");
            suggestions.add("修改布局");
            suggestions.add("重新生成");
            response.setSuggestions(suggestions);
        } else {
            response.setType("error");
            response.setContent(message);
        }
        
        return response;
    }
}
