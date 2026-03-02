package com.smartmall.interfaces.dto.navigation;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class NavigationDynamicVersionResponse {

    private String projectId;
    private String dynamicVersion;
    private LocalDateTime serverTime;
}

