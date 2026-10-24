package com.threadpilot.security;

import com.threadpilot.user.User;
import com.threadpilot.user.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        try {
            if (SecurityContextHolder.getContext().getAuthentication() != null) {
                filterChain.doFilter(request, response);
                return;
            }

            final String authHeader = request.getHeader("Authorization");
            final String jwt;
            final String userEmail;

            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                filterChain.doFilter(request, response);
                return;
            }

            jwt = authHeader.substring(7);
            try {
                userEmail = jwtService.extractUsername(jwt);
            } catch (Exception e) {
                log.debug("Invalid JWT token: {}", e.getMessage());
                filterChain.doFilter(request, response);
                return;
            }

            if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                String organizationIdStr;
                try {
                    organizationIdStr = jwtService.extractOrganizationId(jwt);
                } catch (Exception e) {
                    log.debug("Could not extract organizationId from JWT: {}", e.getMessage());
                    filterChain.doFilter(request, response);
                    return;
                }

                if (organizationIdStr == null) {
                    log.warn("JWT token missing organizationId claim");
                    filterChain.doFilter(request, response);
                    return;
                }

                UUID organizationId;
                try {
                    organizationId = UUID.fromString(organizationIdStr);
                } catch (IllegalArgumentException e) {
                    log.warn("Invalid organizationId in JWT: {}", organizationIdStr);
                    filterChain.doFilter(request, response);
                    return;
                }

User user = userRepository.findByEmailAndOrganizationId(userEmail, organizationId).orElse(null);

                if (user == null) {
                    log.warn("User not found in organization for JWT authentication: email={}, organizationId={}", userEmail, organizationId);
                    filterChain.doFilter(request, response);
                    return;
                }

                UserDetails userDetails = new org.springframework.security.core.userdetails.User(
                        user.getEmail(),
                        user.getPasswordHash(),
                        user.getRoles().stream()
                                .map(role -> new SimpleGrantedAuthority("ROLE_" + role.getName()))
                                .collect(Collectors.toList())
                );

                if (jwtService.isTokenValid(jwt, userDetails)) {
                    TenantContext.setOrganizationId(organizationId);
                    TenantContext.setUserId(user.getId());

                    List<GrantedAuthority> authorities = user.getRoles().stream()
                            .map(role -> new SimpleGrantedAuthority("ROLE_" + role.getName()))
                            .collect(Collectors.toList());

                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            userDetails,
                            null,
                            authorities
                    );
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }
            }

            filterChain.doFilter(request, response);
        } finally {
            TenantContext.clear();
        }
    }
}