package com.threadpilot;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.transaction.annotation.EnableTransactionManagement;

@SpringBootApplication
@EnableJpaRepositories(basePackages = "com.threadpilot")
@EntityScan(basePackages = "com.threadpilot")
@EnableTransactionManagement
@EnableAsync
@EnableScheduling
@EnableJpaAuditing
public class ThreadPilotApplication {

    public static void main(String[] args) {
        loadEnvIfPresent();
        SpringApplication.run(ThreadPilotApplication.class, args);
    }

    private static void loadEnvIfPresent() {
        java.nio.file.Path[] candidates = {
            java.nio.file.Paths.get(".env"),
            java.nio.file.Paths.get("../.env"),
            java.nio.file.Paths.get("backend/.env")
        };
        for (java.nio.file.Path path : candidates) {
            if (java.nio.file.Files.isRegularFile(path)) {
                try (java.io.BufferedReader reader = java.nio.file.Files.newBufferedReader(path)) {
                    String line;
                    while ((line = reader.readLine()) != null) {
                        line = line.trim();
                        if (line.isEmpty() || line.startsWith("#")) {
                            continue;
                        }
                        int eqIdx = line.indexOf('=');
                        if (eqIdx > 0) {
                            String key = line.substring(0, eqIdx).trim();
                            String value = line.substring(eqIdx + 1).trim();
                            if ((value.startsWith("\"") && value.endsWith("\"")) ||
                                (value.startsWith("'") && value.endsWith("'"))) {
                                value = value.substring(1, value.length() - 1);
                            }
                            if (System.getProperty(key) == null && System.getenv(key) == null) {
                                System.setProperty(key, value);
                            }
                        }
                    }
                } catch (Exception ignored) {
                }
            }
        }
    }
}
