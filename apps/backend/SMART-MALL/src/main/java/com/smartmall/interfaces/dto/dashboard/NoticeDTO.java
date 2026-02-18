package com.smartmall.interfaces.dto.dashboard;

import lombok.Data;
import java.time.LocalDateTime;

/**
 * 系统公告 DTO
 */
@Data
public class NoticeDTO {

    /**
     * 公告ID
     */
    private String noticeId;

    /**
     * 标题
     */
    private String title;

    /**
     * 内容
     */
    private String content;

    /**
     * 发布时间
     */
    private LocalDateTime publishedAt;
}
