package com.smartmall.interfaces.dto.merchant;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.List;

/**
 * 店铺布局响应 DTO
 *
 * 镜像 Python GenerateStoreLayoutResponse 结构
 */
@Data
@Schema(description = "AI 店铺布局生成响应")
public class StoreLayoutResponse {

    @Schema(description = "是否成功")
    private Boolean success;

    @Schema(description = "响应消息")
    private String message;

    @Schema(description = "布局数据")
    private StoreLayoutData data;

    /**
     * 店铺布局数据
     */
    @Data
    @Schema(description = "店铺布局数据")
    public static class StoreLayoutData {

        @Schema(description = "主题名称", example = "日式简约咖啡店")
        private String theme;

        @Schema(description = "区域 ID", example = "area_001")
        private String areaId;

        @Schema(description = "对象列表")
        private List<StoreObject> objects;
    }

    /**
     * 店铺内的单个对象
     */
    @Data
    @Schema(description = "店铺对象")
    public static class StoreObject {

        @Schema(description = "对象名称", example = "吧台")
        private String name;

        @Schema(description = "材质预设 ID", example = "counter")
        private String materialId;

        @Schema(description = "位置")
        private Position3D position;

        @Schema(description = "旋转")
        private Rotation rotation;

        @Schema(description = "缩放")
        private Scale3D scale;
    }

    /**
     * 3D 位置
     */
    @Data
    @Schema(description = "3D 位置")
    public static class Position3D {

        @Schema(description = "X 坐标")
        private Double x;

        @Schema(description = "Y 坐标")
        private Double y;

        @Schema(description = "Z 坐标")
        private Double z;
    }

    /**
     * 旋转（绕 Y 轴）
     */
    @Data
    @Schema(description = "旋转")
    public static class Rotation {

        @Schema(description = "绕 Y 轴旋转角度")
        private Double y = 0.0;
    }

    /**
     * 3D 缩放
     */
    @Data
    @Schema(description = "3D 缩放")
    public static class Scale3D {

        @Schema(description = "X 缩放")
        private Double x = 1.0;

        @Schema(description = "Y 缩放")
        private Double y = 1.0;

        @Schema(description = "Z 缩放")
        private Double z = 1.0;
    }
}
