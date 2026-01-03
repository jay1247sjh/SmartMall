package com.smartmall.infrastructure.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.smartmall.domain.entity.MallProject;
import org.apache.ibatis.annotations.Mapper;

/**
 * 商城项目 Mapper
 */
@Mapper
public interface MallProjectMapper extends BaseMapper<MallProject> {
}
