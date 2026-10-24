package com.threadpilot.ocr;

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
public class OcrProviderFactory {

    private final List<OcrProvider> providers;
    private final Map<String, OcrProvider> providerMap = new ConcurrentHashMap<>();

    @Value("${threadpilot.ocr.provider:mock}")
    private String defaultProviderName;

    @jakarta.annotation.PostConstruct
    public void init() {
        for (OcrProvider provider : providers) {
            providerMap.put(provider.getName().toLowerCase(), provider);
            log.info("Registered OCR provider: {}", provider.getName());
        }
    }

    public OcrProvider getProvider(String name) {
        OcrProvider provider = providerMap.get(name.toLowerCase());
        if (provider == null) {
            throw new IllegalArgumentException("Unknown OCR provider: " + name);
        }
        return provider;
    }

    public OcrProvider getDefaultProvider() {
        OcrProvider provider = getProvider(defaultProviderName);
        if (!provider.isAvailable()) {
            log.warn("Default OCR provider {} not available, falling back to mock", defaultProviderName);
            return getProvider("mock");
        }
        return provider;
    }
}

