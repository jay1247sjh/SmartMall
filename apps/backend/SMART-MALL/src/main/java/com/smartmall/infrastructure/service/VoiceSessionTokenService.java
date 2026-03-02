package com.smartmall.infrastructure.service;

import com.smartmall.common.exception.BusinessException;
import com.smartmall.common.response.ResultCode;
import com.smartmall.interfaces.dto.ai.VoiceSessionResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.UUID;

/**
 * 语音会话令牌签发服务
 *
 * 通过 HMAC 签名发放短期会话令牌，避免前端直接暴露长期密钥。
 */
@Slf4j
@Service
public class VoiceSessionTokenService {

    private static final String HMAC_SHA256 = "HmacSHA256";

    @Value("${intelligence.service.voice.enabled:true}")
    private boolean voiceEnabled;

    @Value("${intelligence.service.voice.session-ttl-sec:180}")
    private long sessionTtlSec;

    @Value("${intelligence.service.voice.signing-secret:smart-mall-voice-secret}")
    private String signingSecret;

    @Value("${intelligence.service.voice.ws-url:ws://localhost:19191/api/voice/ws}")
    private String wsBaseUrl;

    public VoiceSessionResponse createSession(String userId, String language, String scene) {
        if (!voiceEnabled) {
            throw new BusinessException(ResultCode.AI_VOICE_DISABLED);
        }
        if (!StringUtils.hasText(signingSecret)) {
            throw new BusinessException(ResultCode.SYSTEM_ERROR, "语音签名密钥未配置");
        }

        String sessionId = "vsn_" + UUID.randomUUID().toString().replace("-", "");
        long exp = Instant.now().plusSeconds(sessionTtlSec).getEpochSecond();
        String sig = sign(sessionId, userId, exp);
        String wsUrl = buildWsUrl(sessionId, userId, exp, sig, language, scene);

        VoiceSessionResponse response = new VoiceSessionResponse();
        response.setSessionId(sessionId);
        response.setWsUrl(wsUrl);
        response.setExpiresAt(Instant.ofEpochSecond(exp).toString());
        return response;
    }

    private String buildWsUrl(String sessionId, String userId, long exp, String sig, String language, String scene) {
        StringBuilder builder = new StringBuilder(wsBaseUrl);
        builder.append(wsBaseUrl.contains("?") ? "&" : "?");
        builder.append("session_id=").append(urlEncode(sessionId));
        builder.append("&user_id=").append(urlEncode(userId));
        builder.append("&exp=").append(exp);
        builder.append("&sig=").append(urlEncode(sig));

        if (StringUtils.hasText(language)) {
            builder.append("&language=").append(urlEncode(language));
        }
        if (StringUtils.hasText(scene)) {
            builder.append("&scene=").append(urlEncode(scene));
        }
        return builder.toString();
    }

    private String sign(String sessionId, String userId, long exp) {
        String payload = sessionId + ":" + userId + ":" + exp;
        try {
            Mac mac = Mac.getInstance(HMAC_SHA256);
            SecretKeySpec keySpec = new SecretKeySpec(signingSecret.getBytes(StandardCharsets.UTF_8), HMAC_SHA256);
            mac.init(keySpec);
            byte[] digest = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            return toHex(digest);
        } catch (Exception e) {
            log.error("生成语音会话签名失败: {}", e.getMessage(), e);
            throw new BusinessException(ResultCode.SYSTEM_ERROR, "语音会话签名失败");
        }
    }

    private String toHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder(bytes.length * 2);
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }

    private String urlEncode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }
}

