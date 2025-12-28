package com.smartmall.common.util;

import com.baomidou.mybatisplus.core.toolkit.IdWorker;

/**
 * ID 生成器
 */
public class IdGenerator {
    
    private IdGenerator() {}
    
    /**
     * 生成雪花ID（字符串形式）
     */
    public static String nextId() {
        return IdWorker.getIdStr();
    }
    
    /**
     * 生成雪花ID（Long形式）
     */
    public static long nextLongId() {
        return IdWorker.getId();
    }
}
