package com.threadpilot.ai;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
@RequiredArgsConstructor
@Slf4j
public class AIProviderFactory {

    private final List<AIProvider> providers;
    private final AIProperties aiProperties;
    private final Map<String, AIProvider> providerMap = new ConcurrentHashMap<>();

    @jakarta.annotation.PostConstruct
    public void init() {
        initializeProviderMap();
    }

    void initializeProviderMap() {
        for (AIProvider provider : providers) {
            providerMap.put(provider.getName().toLowerCase(), provider);
            log.info("Registered AI provider: {}", provider.getName());
        }
    }

    public AIProvider getProvider(String name) {
        AIProvider provider = providerMap.get(name.toLowerCase());
        if (provider == null) {
            throw new IllegalArgumentException("Unknown AI provider: " + name);
        }
        return provider;
    }

    public AIProvider getDefaultProvider() {
        String providerName = aiProperties.getProvider();
        AIProvider provider = getProvider(providerName);
        if (!provider.isAvailable()) {
            log.warn("Configured provider {} not available, falling back to mock", providerName);
            return getProvider("mock");
        }
        return provider;
    }

    public List<AIProvider> getAvailableProviders() {
        return providers.stream().filter(AIProvider::isAvailable).toList();
    }
}

