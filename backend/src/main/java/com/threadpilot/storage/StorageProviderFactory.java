package com.threadpilot.storage;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
@RequiredArgsConstructor
@Slf4j
public class StorageProviderFactory {

    private final List<StorageProvider> providers;
    private final Map<String, StorageProvider> providerMap = new ConcurrentHashMap<>();

    @Value("${threadpilot.storage.provider:local}")
    private String defaultProviderName;

    @jakarta.annotation.PostConstruct
    public void init() {
        for (StorageProvider provider : providers) {
            providerMap.put(provider.getName().toLowerCase(), provider);
            log.info("Registered storage provider: {}", provider.getName());
        }
    }

    public StorageProvider getProvider(String name) {
        StorageProvider provider = providerMap.get(name.toLowerCase());
        if (provider == null) {
            throw new IllegalArgumentException("Unknown storage provider: " + name);
        }
        return provider;
    }

    public StorageProvider getDefaultProvider() {
        StorageProvider provider = getProvider(defaultProviderName);
        if (!provider.isAvailable()) {
            log.warn("Default storage provider {} not available, falling back to local", defaultProviderName);
            return getProvider("local");
        }
        return provider;
    }
}

