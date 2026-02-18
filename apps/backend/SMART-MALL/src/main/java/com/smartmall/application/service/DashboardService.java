package com.smartmall.application.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartmall.domain.entity.AreaApply;
import com.smartmall.domain.entity.Notice;
import com.smartmall.domain.entity.Store;
import com.smartmall.domain.entity.User;
import com.smartmall.domain.enums.ApplyStatus;
import com.smartmall.domain.enums.UserType;
import com.smartmall.infrastructure.mapper.AreaApplyMapper;
import com.smartmall.infrastructure.mapper.NoticeMapper;
import com.smartmall.infrastructure.mapper.ProductMapper;
import com.smartmall.infrastructure.mapper.StoreMapper;
import com.smartmall.infrastructure.mapper.UserMapper;
import com.smartmall.interfaces.dto.dashboard.AdminStatsDTO;
import com.smartmall.interfaces.dto.dashboard.MerchantStatsDTO;
import com.smartmall.interfaces.dto.dashboard.NoticeDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

/**
 * 仪表盘统计服务
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DashboardService {

    private static final String ADMIN_STATS_CACHE_KEY = "dashboard:admin:stats";
    private static final String MERCHANT_STATS_CACHE_KEY_PREFIX = "dashboard:merchant:stats:";
    private static final long CACHE_TTL_MINUTES = 5;

    private final UserMapper userMapper;
    private final StoreMapper storeMapper;
    private final AreaApplyMapper areaApplyMapper;
    private final ProductMapper productMapper;
    private final NoticeMapper noticeMapper;
    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    /**
     * 获取管理员统计数据（带 Redis 缓存降级）
     */
    public AdminStatsDTO getAdminStats() {
        // 尝试从缓存读取
        try {
            String cached = redisTemplate.opsForValue().get(ADMIN_STATS_CACHE_KEY);
            if (cached != null) {
                return objectMapper.readValue(cached, AdminStatsDTO.class);
            }
        } catch (Exception e) {
            log.warn("Redis 读取管理员统计缓存失败，降级为数据库查询", e);
        }

        // 从数据库查询
        AdminStatsDTO stats = queryAdminStatsFromDB();

        // 尝试写入缓存
        try {
            String json = objectMapper.writeValueAsString(stats);
            redisTemplate.opsForValue().set(ADMIN_STATS_CACHE_KEY, json, CACHE_TTL_MINUTES, TimeUnit.MINUTES);
        } catch (Exception e) {
            log.warn("Redis 写入管理员统计缓存失败", e);
        }

        return stats;
    }

    /**
     * 获取商家统计数据（带 Redis 缓存降级）
     */
    public MerchantStatsDTO getMerchantStats(String merchantId) {
        String cacheKey = MERCHANT_STATS_CACHE_KEY_PREFIX + merchantId;

        // 尝试从缓存读取
        try {
            String cached = redisTemplate.opsForValue().get(cacheKey);
            if (cached != null) {
                return objectMapper.readValue(cached, MerchantStatsDTO.class);
            }
        } catch (Exception e) {
            log.warn("Redis 读取商家统计缓存失败，降级为数据库查询, merchantId={}", merchantId, e);
        }

        // 从数据库查询
        MerchantStatsDTO stats = queryMerchantStatsFromDB(merchantId);

        // 尝试写入缓存
        try {
            String json = objectMapper.writeValueAsString(stats);
            redisTemplate.opsForValue().set(cacheKey, json, CACHE_TTL_MINUTES, TimeUnit.MINUTES);
        } catch (Exception e) {
            log.warn("Redis 写入商家统计缓存失败, merchantId={}", merchantId, e);
        }

        return stats;
    }

    /**
     * 获取系统公告列表
     */
    public List<NoticeDTO> getNotices(int limit) {
        // 参数校验：limit 越界时使用默认值
        if (limit < 1 || limit > 50) {
            limit = 5;
        }

        List<Notice> notices = noticeMapper.selectActiveNotices(limit);

        return notices.stream()
                .map(this::convertToNoticeDTO)
                .collect(Collectors.toList());
    }

    /**
     * 清除管理员统计缓存
     */
    public void evictAdminStatsCache() {
        try {
            redisTemplate.delete(ADMIN_STATS_CACHE_KEY);
        } catch (Exception e) {
            log.warn("Redis 清除管理员统计缓存失败", e);
        }
    }

    /**
     * 清除商家统计缓存
     */
    public void evictMerchantStatsCache(String merchantId) {
        try {
            redisTemplate.delete(MERCHANT_STATS_CACHE_KEY_PREFIX + merchantId);
        } catch (Exception e) {
            log.warn("Redis 清除商家统计缓存失败, merchantId={}", merchantId, e);
        }
    }

    // ==================== 私有方法 ====================

    private AdminStatsDTO queryAdminStatsFromDB() {
        AdminStatsDTO stats = new AdminStatsDTO();

        // 商家总数
        LambdaQueryWrapper<User> merchantWrapper = new LambdaQueryWrapper<>();
        merchantWrapper.eq(User::getUserType, UserType.MERCHANT)
                .eq(User::getIsDeleted, false);
        stats.setMerchantCount(userMapper.selectCount(merchantWrapper));

        // 店铺总数
        LambdaQueryWrapper<Store> storeWrapper = new LambdaQueryWrapper<>();
        storeWrapper.eq(Store::getIsDeleted, false);
        stats.setStoreCount(storeMapper.selectCount(storeWrapper));

        // 待审批数
        LambdaQueryWrapper<AreaApply> applyWrapper = new LambdaQueryWrapper<>();
        applyWrapper.eq(AreaApply::getStatus, ApplyStatus.PENDING)
                .eq(AreaApply::getIsDeleted, false);
        stats.setPendingApprovals(areaApplyMapper.selectCount(applyWrapper));

        // 今日活跃用户数
        LambdaQueryWrapper<User> activeWrapper = new LambdaQueryWrapper<>();
        activeWrapper.ge(User::getLastLoginTime, LocalDate.now().atStartOfDay())
                .eq(User::getIsDeleted, false);
        stats.setTodayActiveUsers(userMapper.selectCount(activeWrapper));

        return stats;
    }

    private MerchantStatsDTO queryMerchantStatsFromDB(String merchantId) {
        MerchantStatsDTO stats = new MerchantStatsDTO();

        // 店铺数量
        LambdaQueryWrapper<Store> storeWrapper = new LambdaQueryWrapper<>();
        storeWrapper.eq(Store::getMerchantId, merchantId)
                .eq(Store::getIsDeleted, false);
        stats.setStoreCount(storeMapper.selectCount(storeWrapper));

        // 商品总数（JOIN 查询）
        stats.setProductCount(productMapper.countByMerchantId(merchantId));

        // 待处理申请数
        LambdaQueryWrapper<AreaApply> applyWrapper = new LambdaQueryWrapper<>();
        applyWrapper.eq(AreaApply::getMerchantId, merchantId)
                .eq(AreaApply::getStatus, ApplyStatus.PENDING)
                .eq(AreaApply::getIsDeleted, false);
        stats.setPendingApplications(areaApplyMapper.selectCount(applyWrapper));

        return stats;
    }

    private NoticeDTO convertToNoticeDTO(Notice notice) {
        NoticeDTO dto = new NoticeDTO();
        dto.setNoticeId(notice.getNoticeId());
        dto.setTitle(notice.getTitle());
        dto.setContent(notice.getContent());
        dto.setPublishedAt(notice.getPublishedAt());
        return dto;
    }
}
