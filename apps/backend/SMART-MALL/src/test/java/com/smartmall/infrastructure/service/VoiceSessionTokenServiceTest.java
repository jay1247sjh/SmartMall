package com.smartmall.infrastructure.service;

import com.smartmall.common.exception.BusinessException;
import com.smartmall.common.response.ResultCode;
import com.smartmall.interfaces.dto.ai.VoiceSessionResponse;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;

class VoiceSessionTokenServiceTest {

    @Test
    void createSession_shouldReturnSignedUrl() {
        VoiceSessionTokenService service = new VoiceSessionTokenService();
        ReflectionTestUtils.setField(service, "voiceEnabled", true);
        ReflectionTestUtils.setField(service, "sessionTtlSec", 180L);
        ReflectionTestUtils.setField(service, "signingSecret", "test-secret");
        ReflectionTestUtils.setField(service, "wsBaseUrl", "ws://localhost:19191/api/voice/ws");

        VoiceSessionResponse response = service.createSession("user-1", "zh-CN", "ai-assistant");

        assertNotNull(response.getSessionId());
        assertNotNull(response.getWsUrl());
        assertTrue(response.getWsUrl().contains("sig="));
        assertTrue(response.getWsUrl().contains("session_id="));
        assertNotNull(response.getExpiresAt());
    }

    @Test
    void createSession_shouldThrowWhenVoiceDisabled() {
        VoiceSessionTokenService service = new VoiceSessionTokenService();
        ReflectionTestUtils.setField(service, "voiceEnabled", false);
        ReflectionTestUtils.setField(service, "sessionTtlSec", 180L);
        ReflectionTestUtils.setField(service, "signingSecret", "test-secret");
        ReflectionTestUtils.setField(service, "wsBaseUrl", "ws://localhost:19191/api/voice/ws");

        BusinessException ex = assertThrows(
                BusinessException.class,
                () -> service.createSession("user-1", "zh-CN", "ai-assistant")
        );
        assertEquals(ResultCode.AI_VOICE_DISABLED.getCode(), ex.getCode());
    }
}

