package com.threadpilot.storage;

import org.springframework.web.multipart.MultipartFile;

public interface StorageProvider {

    String getName();

    String store(MultipartFile file, String pathPrefix);

    String store(byte[] data, String filename, String contentType, String pathPrefix);

    byte[] retrieve(String path);

    void delete(String path);

    boolean exists(String path);

    String getUrl(String path);

    boolean isAvailable();

    void validateConfiguration();
}

