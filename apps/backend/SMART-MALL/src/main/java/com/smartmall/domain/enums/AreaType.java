package com.smartmall.domain.enums;

/**
 * 区域类型
 * 
 * 与共享类型包保持一致
 * @see packages/shared-types/src/enums/area.ts
 */
public enum AreaType {
    RETAIL("retail"),       // 零售
    FOOD("food"),           // 餐饮
    SERVICE("service"),     // 服务
    ANCHOR("anchor"),       // 主力店
    COMMON("common"),       // 公共区域
    CORRIDOR("corridor"),   // 走廊
    ELEVATOR("elevator"),   // 电梯
    ESCALATOR("escalator"), // 扶梯
    STAIRS("stairs"),       // 楼梯
    RESTROOM("restroom"),   // 洗手间
    STORAGE("storage"),     // 仓储
    OFFICE("office"),       // 办公
    PARKING("parking"),     // 停车
    OTHER("other");         // 其他
    
    private final String value;
    
    AreaType(String value) {
        this.value = value;
    }
    
    public String getValue() {
        return value;
    }
    
    public static AreaType fromValue(String value) {
        for (AreaType type : values()) {
            if (type.value.equals(value)) {
                return type;
            }
        }
        throw new IllegalArgumentException("Unknown AreaType: " + value);
    }
}
