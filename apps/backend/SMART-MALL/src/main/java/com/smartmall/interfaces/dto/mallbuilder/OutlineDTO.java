package com.smartmall.interfaces.dto.mallbuilder;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

/**
 * 轮廓 DTO
 */
@Data
public class OutlineDTO {
    
    @NotNull(message = "顶点列表不能为空")
    @Size(min = 3, message = "轮廓至少需要3个顶点")
    private List<VertexDTO> vertices;
    
    private Boolean isClosed = true;
    
    @Data
    public static class VertexDTO {
        private Double x;
        private Double y;
    }
}
