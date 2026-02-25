package com.smartmall.infrastructure.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

/**
 * Intelligence Service 配置
 * 
 * 配置与 Python AI 服务的通信
 */
@Configuration
public class IntelligenceServiceConfig {
    
    @Value("${intelligence.service.url:http://localhost:19191}")
    private String intelligenceServiceUrl;
    
    @Value("${intelligence.service.timeout:60000}")
    private int timeout;
    
    @Bean
    public RestTemplate intelligenceRestTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(10000);
        factory.setReadTimeout(timeout);
        return new RestTemplate(factory);
    }
    
    public String getIntelligenceServiceUrl() {
        return intelligenceServiceUrl;
    }
    
    public int getTimeout() {
        return timeout;
    }
}
