package com.smartmall.infrastructure.config;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.ibatis.type.BaseTypeHandler;
import org.apache.ibatis.type.JdbcType;
import org.apache.ibatis.type.MappedJdbcTypes;
import org.apache.ibatis.type.MappedTypes;
import org.postgresql.util.PGobject;

import java.sql.CallableStatement;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Map;

/**
 * PostgreSQL JSONB 类型处理器
 * 用于 MyBatis-Plus 处理 PostgreSQL 的 JSONB 字段
 */
@MappedTypes(Map.class)
@MappedJdbcTypes(JdbcType.OTHER)
public class PostgresJsonbTypeHandler extends BaseTypeHandler<Map<String, Object>> {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    @Override
    public void setNonNullParameter(PreparedStatement ps, int i, Map<String, Object> parameter, JdbcType jdbcType) throws SQLException {
        PGobject pgObject = new PGobject();
        pgObject.setType("jsonb");
        try {
            pgObject.setValue(OBJECT_MAPPER.writeValueAsString(parameter));
        } catch (JsonProcessingException e) {
            throw new SQLException("Error converting Map to JSON string", e);
        }
        ps.setObject(i, pgObject);
    }

    @Override
    public Map<String, Object> getNullableResult(ResultSet rs, String columnName) throws SQLException {
        return parseJson(rs.getString(columnName));
    }

    @Override
    public Map<String, Object> getNullableResult(ResultSet rs, int columnIndex) throws SQLException {
        return parseJson(rs.getString(columnIndex));
    }

    @Override
    public Map<String, Object> getNullableResult(CallableStatement cs, int columnIndex) throws SQLException {
        return parseJson(cs.getString(columnIndex));
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> parseJson(String json) throws SQLException {
        if (json == null || json.isEmpty()) {
            return null;
        }
        try {
            return OBJECT_MAPPER.readValue(json, Map.class);
        } catch (JsonProcessingException e) {
            throw new SQLException("Error parsing JSON string to Map", e);
        }
    }
}
