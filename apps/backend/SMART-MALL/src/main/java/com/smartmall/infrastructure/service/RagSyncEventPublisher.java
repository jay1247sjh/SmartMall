package com.smartmall.infrastructure.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

/**
 * RAG 增量同步事件发布器
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RagSyncEventPublisher {

    private final RestTemplate intelligenceRestTemplate;

    @Value("${intelligence.service.url:http://localhost:19191}")
    private String intelligenceServiceUrl;

    /**
     * 异步发布同步事件
     */
    public void publishAsync(String entityType, String operation, String entityId, Map<String, Object> payload) {
        CompletableFuture.runAsync(() -> publish(entityType, operation, entityId, payload));
    }

    private void publish(String entityType, String operation, String entityId, Map<String, Object> payload) {
        String url = intelligenceServiceUrl + "/api/sync/events";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> body = new HashMap<>();
        body.put("event_id", UUID.randomUUID().toString());
        body.put("entity_type", entityType);
        body.put("operation", operation);
        body.put("entity_id", entityId);
        body.put("payload", payload == null ? new HashMap<>() : payload);
        body.put("timestamp", Instant.now().toString());
        body.put("source", "java_backend");

        try {
            intelligenceRestTemplate.postForEntity(url, new HttpEntity<>(body, headers), Void.class);
        } catch (Exception e) {
            log.warn("发布 RAG 同步事件失败: entityType={}, operation={}, entityId={}, error={}",
                    entityType, operation, entityId, e.getMessage());
        }
    }
}

