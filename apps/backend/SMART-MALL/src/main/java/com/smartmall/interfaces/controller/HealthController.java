package com.smartmall.interfaces.controller;

import com.smartmall.common.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

/**
 * 健康检查控制器
 */
@Tag(name = "健康检查", description = "系统健康状态检查")
@RestController
@RequestMapping("/health")
@RequiredArgsConstructor
public class HealthController {

    private final PasswordEncoder passwordEncoder;

    @Operation(summary = "健康检查")
    @GetMapping
    public ApiResponse<Map<String, Object>> health() {
        Map<String, Object> data = new HashMap<>();
        data.put("status", "UP");
        data.put("timestamp", System.currentTimeMillis());
        return ApiResponse.success(data);
    }

    @Operation(summary = "生成密码哈希（仅用于调试）")
    @GetMapping("/hash")
    public ApiResponse<Map<String, Object>> generateHash(@RequestParam(defaultValue = "123456") String password) {
        Map<String, Object> data = new HashMap<>();
        String hash = passwordEncoder.encode(password);
        data.put("password", password);
        data.put("hash", hash);
        data.put("matches", passwordEncoder.matches(password, hash));
        return ApiResponse.success(data);
    }
}
