package com.smartmall.application.service;

import com.smartmall.common.exception.BusinessException;
import com.smartmall.common.response.ResultCode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

/**
 * 商品图片本地存储服务
 */
@Slf4j
@Service
public class ProductImageStorageService {

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("png", "jpg", "jpeg", "webp");

    @Value("${smartmall.upload.base-path:uploads}")
    private String basePath;

    @Value("${smartmall.upload.base-url:/api/uploads}")
    private String baseUrl;

    @Value("${smartmall.upload.max-images-per-request:10}")
    private Integer maxImagesPerRequest;

    @Value("${smartmall.upload.max-file-size-bytes:5242880}")
    private Long maxFileSizeBytes;

    /**
     * 批量上传商品图片
     */
    public List<String> storeProductImages(List<MultipartFile> files) {
        if (files == null || files.isEmpty()) {
            return List.of();
        }
        if (files.size() > maxImagesPerRequest) {
            throw new BusinessException(ResultCode.PRODUCT_IMAGE_TOO_MANY);
        }

        List<String> urls = new ArrayList<>();
        for (MultipartFile file : files) {
            urls.add(storeSingle(file));
        }
        return urls;
    }

    private String storeSingle(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException(ResultCode.PARAM_INVALID, "图片文件不能为空");
        }
        if (file.getSize() > maxFileSizeBytes) {
            throw new BusinessException(ResultCode.PRODUCT_IMAGE_TOO_LARGE);
        }

        String originalFilename = file.getOriginalFilename();
        String extension = extractExtension(originalFilename);
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new BusinessException(ResultCode.PRODUCT_IMAGE_INVALID);
        }

        String monthFolder = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMM"));
        Path dirPath = Paths.get(basePath, "products", monthFolder);
        String fileName = UUID.randomUUID().toString().replace("-", "") + "." + extension;
        Path filePath = dirPath.resolve(fileName);

        try {
            Files.createDirectories(dirPath);
            file.transferTo(filePath);
        } catch (IOException e) {
            log.error("保存商品图片失败: {}", e.getMessage(), e);
            throw new BusinessException(ResultCode.SYSTEM_ERROR, "商品图片保存失败");
        }

        return baseUrl + "/products/" + monthFolder + "/" + fileName;
    }

    private String extractExtension(String originalFilename) {
        if (!StringUtils.hasText(originalFilename) || !originalFilename.contains(".")) {
            throw new BusinessException(ResultCode.PRODUCT_IMAGE_INVALID);
        }
        String extension = originalFilename.substring(originalFilename.lastIndexOf('.') + 1)
                .trim()
                .toLowerCase(Locale.ROOT);
        if (!StringUtils.hasText(extension)) {
            throw new BusinessException(ResultCode.PRODUCT_IMAGE_INVALID);
        }
        return extension;
    }
}
