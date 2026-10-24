package com.threadpilot.security;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final OrganizationAuthenticationProvider organizationAuthenticationProvider;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter, OrganizationAuthenticationProvider organizationAuthenticationProvider) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.organizationAuthenticationProvider = organizationAuthenticationProvider;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/auth/login", "/auth/register", "/auth/refresh", "/auth/logout").permitAll()
                        .requestMatchers("/auth/me").authenticated()
                        .requestMatchers("/health", "/actuator/**").permitAll()
                        .requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()
                        .requestMatchers(HttpMethod.GET, "/products/**").authenticated()
                        .requestMatchers(HttpMethod.POST, "/products/**").hasAnyRole("OWNER", "ADMIN", "MANAGER", "INVENTORY_MANAGER")
                        .requestMatchers(HttpMethod.PUT, "/products/**").hasAnyRole("OWNER", "ADMIN", "MANAGER", "INVENTORY_MANAGER")
                        .requestMatchers(HttpMethod.DELETE, "/products/**").hasAnyRole("OWNER", "ADMIN")
                        .requestMatchers("/inventory/**").authenticated()
                        .requestMatchers("/suppliers/**").authenticated()
                        .requestMatchers("/invoices/**").authenticated()
                        .requestMatchers("/customers/**").authenticated()
                        .requestMatchers("/orders/**").authenticated()
                        .requestMatchers("/sales/**").authenticated()
                        .requestMatchers("/payments/**").authenticated()
                        .requestMatchers("/expenses/**").authenticated()
                        .requestMatchers("/analytics/**").authenticated()
                        .requestMatchers("/copilot/**").authenticated()
                        .requestMatchers("/alerts/**").authenticated()
                        .requestMatchers("/reminders/**").authenticated()
                        .requestMatchers("/search/**").authenticated()
                        .requestMatchers("/dashboard/**").authenticated()
                        .requestMatchers("/ocr/**").authenticated()
                        .requestMatchers("/storage/**").authenticated()
                        .requestMatchers("/recommendations/**").authenticated()
                        .requestMatchers("/audit/**").hasAnyRole("OWNER", "ADMIN", "ACCOUNTANT")
                        .requestMatchers("/users/**").hasAnyRole("OWNER", "ADMIN")
                        .requestMatchers("/organizations/**").hasAnyRole("OWNER", "ADMIN")
                        .anyRequest().authenticated()
                )
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint((request, response, authException) -> {
                            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                            response.setContentType("application/json");
                            response.getWriter().write("{\"success\":false,\"message\":\"Unauthorized\",\"timestamp\":\"" + java.time.Instant.now() + "\"}");
                        })
                )
                .authenticationProvider(organizationAuthenticationProvider)
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public static PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of("http://localhost:3000", "http://localhost:5173", "http://localhost:8080"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
