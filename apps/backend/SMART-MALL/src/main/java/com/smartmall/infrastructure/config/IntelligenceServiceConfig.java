package com.smartmall.infrastructure.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

/**
 * Intelligence Service 配置
 * 
 * 配置与 Python AI 服务的通信
 */
@Configuration
public class IntelligenceServiceConfig {
    
    @Value("${intelligence.service.url:http://localhost:9001}")
    private String intelligenceServiceUrl;
    
    @Value("${intelligence.service.timeout:30000}")
    private int timeout;
    
    @Bean
    public RestTemplate intelligenceRestTemplate() {
        return new RestTemplate();
    }
    
    public String getIntelligenceServiceUrl() {
        return intelligenceServiceUrl;
    }
    
    public int getTimeout() {
        return timeout;
    }
}
