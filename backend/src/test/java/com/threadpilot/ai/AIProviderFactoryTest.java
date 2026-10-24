package com.threadpilot.ai;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AIProviderFactoryTest {

    @Mock
    private AIProvider mockProvider;

    @Mock
    private AIProvider nvidiaProvider;

    private AIProviderFactory factory;
    private AIProperties aiProperties;

    @BeforeEach
    void setUp() {
        aiProperties = new AIProperties();
        factory = new AIProviderFactory(List.of(mockProvider, nvidiaProvider), aiProperties);
        
        // Configure mock providers - use lenient to allow unused stubbings
        lenient().when(mockProvider.getName()).thenReturn("mock");
        lenient().when(mockProvider.isAvailable()).thenReturn(true);
        lenient().when(nvidiaProvider.getName()).thenReturn("nvidia");
        
        // Initialize provider map (normally done in @PostConstruct)
        factory.initializeProviderMap();
    }

    @Test
    void getDefaultProvider_returnsMock_whenExplicitlyConfigured() {
        aiProperties.setProvider("mock");
        when(mockProvider.isAvailable()).thenReturn(true);

        AIProvider provider = factory.getDefaultProvider();

        assertThat(provider).isSameAs(mockProvider);
    }

    @Test
    void getDefaultProvider_returnsNvidia_whenConfiguredAndAvailable() {
        aiProperties.setProvider("nvidia");
        when(nvidiaProvider.isAvailable()).thenReturn(true);

        AIProvider provider = factory.getDefaultProvider();

        assertThat(provider).isSameAs(nvidiaProvider);
    }

    @Test
    void getDefaultProvider_fallsBackToMock_whenNvidiaUnavailable() {
        aiProperties.setProvider("nvidia");
        lenient().when(nvidiaProvider.isAvailable()).thenReturn(false);
        lenient().when(mockProvider.isAvailable()).thenReturn(true);

        AIProvider provider = factory.getDefaultProvider();

        assertThat(provider).isSameAs(mockProvider);
    }

    @Test
    void getDefaultProvider_throwsException_whenProviderUnknown() {
        aiProperties.setProvider("unknown");

        assertThatThrownBy(() -> factory.getDefaultProvider())
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Unknown AI provider: unknown");
    }

    @Test
    void getDefaultProvider_throwsException_whenConfiguredProviderNotRegistered() {
        aiProperties.setProvider("openai");

        assertThatThrownBy(() -> factory.getDefaultProvider())
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Unknown AI provider: openai");
    }

    @Test
    void getProvider_returnsCorrectProvider() {
        assertThat(factory.getProvider("mock")).isSameAs(mockProvider);
        assertThat(factory.getProvider("MOCK")).isSameAs(mockProvider);
        assertThat(factory.getProvider("nvidia")).isSameAs(nvidiaProvider);
        assertThat(factory.getProvider("NVIDIA")).isSameAs(nvidiaProvider);
    }

    @Test
    void getProvider_throwsException_whenUnknown() {
        assertThatThrownBy(() -> factory.getProvider("unknown"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Unknown AI provider: unknown");
    }

    @Test
    void getAvailableProviders_returnsOnlyAvailable() {
        when(mockProvider.isAvailable()).thenReturn(true);
        when(nvidiaProvider.isAvailable()).thenReturn(false);

        List<AIProvider> available = factory.getAvailableProviders();

        assertThat(available).containsExactly(mockProvider);
    }
}