package com.smartmall.application.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.smartmall.common.exception.BusinessException;
import com.smartmall.common.response.ResultCode;
import com.smartmall.common.util.IdGenerator;
import com.smartmall.domain.entity.Store;
import com.smartmall.domain.entity.UserBrowseHistory;
import com.smartmall.domain.entity.UserCoupon;
import com.smartmall.domain.entity.UserFavoriteStore;
import com.smartmall.domain.entity.UserOrder;
import com.smartmall.domain.enums.CouponDiscountType;
import com.smartmall.domain.enums.StoreStatus;
import com.smartmall.domain.enums.UserCouponStatus;
import com.smartmall.domain.enums.UserOrderStatus;
import com.smartmall.infrastructure.mapper.StoreMapper;
import com.smartmall.infrastructure.mapper.UserBrowseHistoryMapper;
import com.smartmall.infrastructure.mapper.UserCouponMapper;
import com.smartmall.infrastructure.mapper.UserFavoriteStoreMapper;
import com.smartmall.infrastructure.mapper.UserOrderMapper;
import com.smartmall.interfaces.dto.user.CreateUserOrderRequest;
import com.smartmall.interfaces.dto.user.UserCouponDTO;
import com.smartmall.interfaces.dto.user.UserOrderDTO;
import com.smartmall.interfaces.dto.user.UserStoreBriefDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 用户互动服务
 */
@Service
@RequiredArgsConstructor
public class UserEngagementService {

    private final StoreMapper storeMapper;
    private final UserFavoriteStoreMapper userFavoriteStoreMapper;
    private final UserBrowseHistoryMapper userBrowseHistoryMapper;
    private final UserOrderMapper userOrderMapper;
    private final UserCouponMapper userCouponMapper;
    private final DashboardService dashboardService;

    /**
     * 获取可互动店铺列表（营业中）
     */
    public List<UserStoreBriefDTO> getActiveStores(int limit) {
        int finalLimit = sanitizeLimit(limit);
        LambdaQueryWrapper<Store> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Store::getStatus, StoreStatus.ACTIVE)
                .eq(Store::getIsDeleted, false)
                .orderByDesc(Store::getCreateTime)
                .last("LIMIT " + finalLimit);
        return storeMapper.selectList(wrapper).stream().map(this::toStoreBrief).toList();
    }

    /**
     * 获取用户收藏店铺ID列表
     */
    public List<String> getFavoriteStoreIds(String userId) {
        return userFavoriteStoreMapper.selectStoreIdsByUserId(userId);
    }

    /**
     * 收藏店铺（幂等）
     */
    @Transactional
    public void addFavorite(String userId, String storeId) {
        requireStoreExists(storeId);
        int exists = userFavoriteStoreMapper.countActiveByUserAndStore(userId, storeId);
        if (exists > 0) {
            return;
        }

        UserFavoriteStore favorite = new UserFavoriteStore();
        favorite.setFavoriteId(IdGenerator.nextId());
        favorite.setUserId(userId);
        favorite.setStoreId(storeId);
        userFavoriteStoreMapper.insert(favorite);

        dashboardService.evictUserStatsCache(userId);
    }

    /**
     * 取消收藏
     */
    @Transactional
    public void removeFavorite(String userId, String storeId) {
        int rows = userFavoriteStoreMapper.softDeleteByUserAndStore(userId, storeId);
        if (rows > 0) {
            dashboardService.evictUserStatsCache(userId);
        }
    }

    /**
     * 记录浏览
     */
    @Transactional
    public void recordBrowse(String userId, String storeId) {
        requireStoreExists(storeId);
        UserBrowseHistory history = new UserBrowseHistory();
        history.setHistoryId(IdGenerator.nextId());
        history.setUserId(userId);
        history.setStoreId(storeId);
        history.setBrowseAt(LocalDateTime.now());
        userBrowseHistoryMapper.insert(history);
        dashboardService.evictUserStatsCache(userId);
    }

    /**
     * 创建订单（MVP）
     */
    @Transactional
    public UserOrderDTO createOrder(String userId, CreateUserOrderRequest request) {
        String storeId = request != null ? request.getStoreId() : null;
        if (storeId != null && !storeId.isBlank()) {
            requireStoreExists(storeId);
        } else {
            storeId = null;
        }

        BigDecimal totalAmount = request != null && request.getTotalAmount() != null
                ? request.getTotalAmount()
                : BigDecimal.valueOf(99);

        UserOrder order = new UserOrder();
        order.setOrderId(IdGenerator.nextId());
        order.setUserId(userId);
        order.setStoreId(storeId);
        order.setStatus(UserOrderStatus.CREATED);
        order.setTotalAmount(totalAmount);
        userOrderMapper.insert(order);

        dashboardService.evictUserStatsCache(userId);
        return toOrderDTO(order);
    }

    /**
     * 获取我的订单
     */
    public List<UserOrderDTO> getOrders(String userId, int limit) {
        int finalLimit = sanitizeLimit(limit);
        return userOrderMapper.selectByUserIdWithLimit(userId, finalLimit).stream()
                .map(this::toOrderDTO)
                .toList();
    }

    /**
     * 领取优惠券（MVP）
     */
    @Transactional
    public UserCouponDTO claimCoupon(String userId) {
        UserCoupon coupon = new UserCoupon();
        coupon.setCouponId(IdGenerator.nextId());
        coupon.setUserId(userId);
        coupon.setCouponName("新人满减券");
        coupon.setDiscountType(CouponDiscountType.AMOUNT);
        coupon.setDiscountValue(BigDecimal.valueOf(20));
        coupon.setStatus(UserCouponStatus.UNUSED);
        coupon.setExpiresAt(LocalDateTime.now().plusDays(30));
        userCouponMapper.insert(coupon);

        dashboardService.evictUserStatsCache(userId);
        return toCouponDTO(coupon);
    }

    /**
     * 使用优惠券
     */
    @Transactional
    public UserCouponDTO useCoupon(String userId, String couponId) {
        UserCoupon coupon = userCouponMapper.selectById(couponId);
        if (coupon == null || Boolean.TRUE.equals(coupon.getIsDeleted()) || !userId.equals(coupon.getUserId())) {
            throw new BusinessException(ResultCode.NOT_FOUND, "优惠券不存在");
        }

        int rows = userCouponMapper.markCouponUsed(userId, couponId);
        if (rows == 0) {
            throw new BusinessException(ResultCode.CONFLICT, "优惠券不可用或已过期");
        }

        dashboardService.evictUserStatsCache(userId);
        UserCoupon refreshed = userCouponMapper.selectById(couponId);
        return toCouponDTO(refreshed);
    }

    /**
     * 获取我的优惠券
     */
    public List<UserCouponDTO> getCoupons(String userId, int limit) {
        int finalLimit = sanitizeLimit(limit);
        return userCouponMapper.selectByUserIdWithLimit(userId, finalLimit).stream()
                .map(this::toCouponDTO)
                .toList();
    }

    private int sanitizeLimit(int limit) {
        if (limit < 1 || limit > 50) {
            return 20;
        }
        return limit;
    }

    private void requireStoreExists(String storeId) {
        Store store = storeMapper.selectById(storeId);
        if (store == null || Boolean.TRUE.equals(store.getIsDeleted())) {
            throw new BusinessException(ResultCode.STORE_NOT_FOUND);
        }
    }

    private UserStoreBriefDTO toStoreBrief(Store store) {
        UserStoreBriefDTO dto = new UserStoreBriefDTO();
        dto.setStoreId(store.getStoreId());
        dto.setName(store.getName());
        dto.setCategory(store.getCategory());
        return dto;
    }

    private UserOrderDTO toOrderDTO(UserOrder order) {
        UserOrderDTO dto = new UserOrderDTO();
        dto.setOrderId(order.getOrderId());
        dto.setStoreId(order.getStoreId());
        dto.setStatus(order.getStatus().name());
        dto.setTotalAmount(order.getTotalAmount());
        dto.setCreatedAt(order.getCreateTime());
        return dto;
    }

    private UserCouponDTO toCouponDTO(UserCoupon coupon) {
        UserCouponDTO dto = new UserCouponDTO();
        dto.setCouponId(coupon.getCouponId());
        dto.setCouponName(coupon.getCouponName());
        dto.setDiscountType(coupon.getDiscountType().name());
        dto.setDiscountValue(coupon.getDiscountValue());
        dto.setStatus(coupon.getStatus().name());
        dto.setExpiresAt(coupon.getExpiresAt());
        dto.setUsedAt(coupon.getUsedAt());
        return dto;
    }
}
