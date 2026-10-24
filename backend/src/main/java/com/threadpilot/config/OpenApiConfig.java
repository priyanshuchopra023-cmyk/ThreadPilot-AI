package com.threadpilot.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {

    @Value("${server.servlet.context-path:/api}")
    private String contextPath;

    @Bean
    public OpenAPI threadPilotOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("ThreadPilot AI API")
                        .version("1.0.0")
                        .description("AI-powered business copilot for hosiery wholesalers and retailers")
                        .license(new License()
                                .name("Proprietary")
                                .url("https://threadpilot.ai/license")))
                .servers(List.of(
                        new Server().url("http://localhost:8080" + contextPath).description("Local Development"),
                        new Server().url("https://api.threadpilot.ai" + contextPath).description("Production")))
                .addSecurityItem(new SecurityRequirement().addList("bearerAuth"))
                .components(new Components()
                        .addSecuritySchemes("bearerAuth", new SecurityScheme()
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .description("JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"")));
    }
}

