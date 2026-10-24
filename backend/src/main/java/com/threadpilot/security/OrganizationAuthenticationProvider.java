package com.threadpilot.security;

import com.threadpilot.auth.AuthService;
import com.threadpilot.common.exception.BusinessException;
import com.threadpilot.organization.Organization;
import com.threadpilot.organization.OrganizationRepository;
import com.threadpilot.user.User;
import com.threadpilot.user.UserRepository;
import com.threadpilot.user.UserStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
@Slf4j
public class OrganizationAuthenticationProvider implements AuthenticationProvider {

    private final UserRepository userRepository;
    private final OrganizationRepository organizationRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public Authentication authenticate(Authentication authentication) throws AuthenticationException {
        OrganizationUsernamePasswordAuthenticationToken authToken = 
                (OrganizationUsernamePasswordAuthenticationToken) authentication;

        String email = (String) authToken.getPrincipal();
        String password = (String) authToken.getCredentials();
        String organizationCode = authToken.getOrganizationCode();

        if (organizationCode == null || organizationCode.isBlank()) {
            throw new BadCredentialsException("Organization code is required");
        }

        final String normalizedOrgCode = organizationCode.trim().toUpperCase();

        Organization organization = organizationRepository.findByCode(normalizedOrgCode)
                .orElseThrow(() -> new BusinessException("ORG_NOT_FOUND", "Organization not found: " + normalizedOrgCode));

        User user = userRepository.findByEmailAndOrganizationId(email, organization.getId())
                .orElseThrow(() -> new BadCredentialsException("Invalid credentials"));

        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new BusinessException("ACCOUNT_INACTIVE", "Account is not active: " + user.getStatus());
        }

        if (!user.isAccountNonLocked()) {
            throw new BusinessException("ACCOUNT_LOCKED", "Account is temporarily locked");
        }

        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid credentials");
        }

        Collection<? extends GrantedAuthority> authorities = user.getRoles().stream()
                .map(role -> new SimpleGrantedAuthority("ROLE_" + role.getName()))
                .collect(Collectors.toList());

        return new OrganizationUsernamePasswordAuthenticationToken(
                user,
                null,
                normalizedOrgCode,
                authorities
        );
    }

    @Override
    public boolean supports(Class<?> authentication) {
        return OrganizationUsernamePasswordAuthenticationToken.class.isAssignableFrom(authentication);
    }
}