package com.smartmall.domain.valueobject;

/**
 * 3D空间边界值对象
 */
public record Geometry3D(
    Vector3D min,
    Vector3D max,
    String shapeType
) {
    public static final String SHAPE_AABB = "AABB";
    public static final String SHAPE_POLYGON = "Polygon";
    
    public Geometry3D {
        if (min == null || max == null) {
            throw new IllegalArgumentException("Geometry3D min/max cannot be null");
        }
        if (shapeType == null || shapeType.isBlank()) {
            shapeType = SHAPE_AABB;
        }
    }
    
    public static Geometry3D aabb(Vector3D min, Vector3D max) {
        return new Geometry3D(min, max, SHAPE_AABB);
    }
}
