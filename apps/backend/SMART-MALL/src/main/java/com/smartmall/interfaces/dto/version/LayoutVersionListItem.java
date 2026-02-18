package com.smartmall.interfaces.dto.version;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 版本列表项（不含 snapshotData，减少数据传输量）
 */
@Data
public class LayoutVersionListItem {

    private String versionId;

    private String versionNumber;

    private String status;

    private String description;

    private Integer changeCount;

    private String sourceProjectId;

    private Integer schemaVersion;

    private String creatorId;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
