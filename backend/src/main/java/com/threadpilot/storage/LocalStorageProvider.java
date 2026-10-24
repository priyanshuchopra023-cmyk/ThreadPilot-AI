package com.threadpilot.storage;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@Component
@Slf4j
public class LocalStorageProvider implements StorageProvider {

    @Value("${threadpilot.storage.local.path:./storage}")
    private String basePath;

    private Path rootPath;

    @jakarta.annotation.PostConstruct
    public void init() {
        this.rootPath = Paths.get(basePath).toAbsolutePath().normalize();
        try {
            Files.createDirectories(rootPath);
            log.info("Local storage initialized at: {}", rootPath);
        } catch (IOException e) {
            log.error("Failed to initialize local storage", e);
            throw new RuntimeException("Failed to initialize local storage", e);
        }
    }

    @Override
    public String getName() {
        return "local";
    }

    @Override
    public String store(MultipartFile file, String pathPrefix) {
        String filename = generateFilename(file.getOriginalFilename());
        String relativePath = buildPath(pathPrefix, filename);
        Path targetPath = rootPath.resolve(relativePath);

        try {
            Files.createDirectories(targetPath.getParent());
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
            log.debug("Stored file: {}", targetPath);
            return relativePath;
        } catch (IOException e) {
            log.error("Failed to store file", e);
            throw new RuntimeException("Failed to store file", e);
        }
    }

    @Override
    public String store(byte[] data, String filename, String contentType, String pathPrefix) {
        String generatedFilename = generateFilename(filename);
        String relativePath = buildPath(pathPrefix, generatedFilename);
        Path targetPath = rootPath.resolve(relativePath);

        try {
            Files.createDirectories(targetPath.getParent());
            Files.write(targetPath, data);
            log.debug("Stored byte array: {}", targetPath);
            return relativePath;
        } catch (IOException e) {
            log.error("Failed to store byte array", e);
            throw new RuntimeException("Failed to store byte array", e);
        }
    }

    @Override
    public byte[] retrieve(String path) {
        Path targetPath = rootPath.resolve(path);
        try {
            return Files.readAllBytes(targetPath);
        } catch (IOException e) {
            log.error("Failed to retrieve file: {}", path, e);
            throw new RuntimeException("Failed to retrieve file", e);
        }
    }

    @Override
    public void delete(String path) {
        Path targetPath = rootPath.resolve(path);
        try {
            Files.deleteIfExists(targetPath);
            log.debug("Deleted file: {}", path);
        } catch (IOException e) {
            log.error("Failed to delete file: {}", path, e);
            throw new RuntimeException("Failed to delete file", e);
        }
    }

    @Override
    public boolean exists(String path) {
        Path targetPath = rootPath.resolve(path);
        return Files.exists(targetPath);
    }

    @Override
    public String getUrl(String path) {
        // In production, this would return a proper URL
        return "/api/storage/files/" + path;
    }

    @Override
    public boolean isAvailable() {
        return Files.exists(rootPath) && Files.isWritable(rootPath);
    }

    @Override
    public void validateConfiguration() {
        if (!isAvailable()) {
            throw new IllegalStateException("Local storage not available at: " + rootPath);
        }
    }

    private String generateFilename(String originalFilename) {
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        return UUID.randomUUID() + extension;
    }

    private String buildPath(String pathPrefix, String filename) {
        String datePath = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy/MM/dd"));
        String cleanPrefix = StringUtils.cleanPath(pathPrefix);
        if (cleanPrefix.endsWith("/")) {
            cleanPrefix = cleanPrefix.substring(0, cleanPrefix.length() - 1);
        }
        return cleanPrefix + "/" + datePath + "/" + filename;
    }
}

