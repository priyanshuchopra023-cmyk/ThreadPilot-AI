package com.threadpilot.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Base64;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtServiceValidationTest {

    private JwtProperties jwtProperties;
    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        jwtProperties = new JwtProperties();
        jwtService = new JwtService(jwtProperties);
    }

    @Test
    void init_failsWhenSecretIsNull() {
        jwtProperties.setSecret(null);

        assertThatThrownBy(() -> jwtService.init())
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("JWT secret not configured")
                .hasMessageContaining("JWT_SECRET");
    }

    @Test
    void init_failsWhenSecretIsEmpty() {
        jwtProperties.setSecret("");

        assertThatThrownBy(() -> jwtService.init())
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("JWT secret not configured");
    }

    @Test
    void init_failsWhenSecretIsBlank() {
        jwtProperties.setSecret("   ");

        assertThatThrownBy(() -> jwtService.init())
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("JWT secret not configured");
    }

    @Test
    void init_failsWhenSecretIsInvalidBase64() {
        jwtProperties.setSecret("not-valid-base64!@#");

        assertThatThrownBy(() -> jwtService.init())
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("not valid Base64");
    }

    @Test
    void init_failsWhenDecodedKeyTooShort() {
        // 16 bytes = 128 bits, less than required 256 bits
        String shortSecret = Base64.getEncoder().encodeToString(new byte[16]);
        jwtProperties.setSecret(shortSecret);

        assertThatThrownBy(() -> jwtService.init())
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("too short for HS256")
                .hasMessageContaining("128 bits");
    }

    @Test
    void init_succeedsWithValid256BitSecret() {
        // 32 bytes = 256 bits, minimum for HS256
        String validSecret = Base64.getEncoder().encodeToString(new byte[32]);
        jwtProperties.setSecret(validSecret);

        jwtService.init();

        assertThat(jwtService.getJwtProperties().getSecret()).isEqualTo(validSecret);
    }

    @Test
    void init_succeedsWithValid512BitSecret() {
        // 64 bytes = 512 bits, exceeds minimum
        String validSecret = Base64.getEncoder().encodeToString(new byte[64]);
        jwtProperties.setSecret(validSecret);

        jwtService.init();

        assertThat(jwtService.getJwtProperties().getSecret()).isEqualTo(validSecret);
    }
}