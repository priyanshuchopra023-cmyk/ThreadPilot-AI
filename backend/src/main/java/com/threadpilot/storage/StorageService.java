package com.threadpilot.storage;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
@Slf4j
public class StorageService {

    private final StorageProviderFactory storageProviderFactory;

    public String store(MultipartFile file, String pathPrefix) {
        StorageProvider provider = storageProviderFactory.getDefaultProvider();
        return provider.store(file, pathPrefix);
    }

    public String store(byte[] data, String filename, String contentType, String pathPrefix) {
        StorageProvider provider = storageProviderFactory.getDefaultProvider();
        return provider.store(data, filename, contentType, pathPrefix);
    }

    public byte[] retrieve(String path) {
        StorageProvider provider = storageProviderFactory.getDefaultProvider();
        return provider.retrieve(path);
    }

    public void delete(String path) {
        StorageProvider provider = storageProviderFactory.getDefaultProvider();
        provider.delete(path);
    }

    public boolean exists(String path) {
        StorageProvider provider = storageProviderFactory.getDefaultProvider();
        return provider.exists(path);
    }

    public String getUrl(String path) {
        StorageProvider provider = storageProviderFactory.getDefaultProvider();
        return provider.getUrl(path);
    }
}

