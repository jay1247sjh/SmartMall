package com.smartmall.domain.valueobject;

/**
 * 3D向量值对象
 */
public record Vector3D(double x, double y, double z) {
    
    public static Vector3D zero() {
        return new Vector3D(0, 0, 0);
    }
    
    public static Vector3D of(double x, double y, double z) {
        return new Vector3D(x, y, z);
    }
}
