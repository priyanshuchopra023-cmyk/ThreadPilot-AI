package com.threadpilot.auth;

import com.threadpilot.auth.dto.AuthResponse;
import com.threadpilot.auth.dto.LoginRequest;
import com.threadpilot.auth.dto.RegisterRequest;
import com.threadpilot.common.exception.BusinessException;
import com.threadpilot.common.exception.ConflictException;
import com.threadpilot.organization.Organization;
import com.threadpilot.organization.OrganizationRepository;
import com.threadpilot.security.JwtService;
import com.threadpilot.security.TenantContext;
import com.threadpilot.user.Role;
import com.threadpilot.user.RoleRepository;
import com.threadpilot.user.SystemRole;
import com.threadpilot.user.User;
import com.threadpilot.user.UserRepository;
import com.threadpilot.user.UserStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final OrganizationRepository organizationRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

@Transactional
    public AuthResponse register(RegisterRequest request) {
        boolean hasTenantContext = TenantContext.hasTenant();
        UUID organizationId;
        Organization organization;

        if (hasTenantContext) {
            // Team member invitation: tenant context exists (admin logged in)
            organizationId = TenantContext.requireTenantId();
            if (userRepository.existsByEmailAndOrganizationId(request.getEmail(), organizationId)) {
                throw new ConflictException("User already exists with email: " + request.getEmail());
            }
            organization = organizationRepository.findById(organizationId)
                    .orElseThrow(() -> new BusinessException("ORG_NOT_FOUND", "Organization not found"));
        } else {
            // First-user registration: no tenant context, create new organization + owner
            // Validate and set organization code
            String organizationCode = request.getOrganizationCode();
            if (organizationCode != null) {
                organizationCode = organizationCode.trim().toUpperCase();
                if (!organizationCode.matches("^[A-Z0-9]{2,20}$")) {
                    throw new BusinessException("INVALID_ORG_CODE", "Organization code must be 2-20 alphanumeric characters");
                }
                if (organizationRepository.existsByCode(organizationCode)) {
                    throw new ConflictException("Organization code already exists: " + organizationCode);
                }
            } else {
                // Generate a code from organization name if not provided
                organizationCode = generateOrganizationCode(request.getOrganizationName());
            }

            // Check global email uniqueness for first registration (no organization scope yet)
            if (userRepository.existsByEmail(request.getEmail())) {
                throw new ConflictException("User already exists with email: " + request.getEmail());
            }

            organization = Organization.builder()
                    .name(request.getOrganizationName())
                    .businessName(request.getOrganizationBusinessName())
                    .gstNumber(request.getOrganizationGstNumber())
                    .email(request.getEmail())
                    .phone(request.getPhone())
                    .city(request.getCity())
                    .state(request.getState())
                    .postalCode(request.getPostalCode())
                    .country(request.getCountry())
                    .code(organizationCode)
                    .isActive(true)
                    .currency("INR")
                    .timezone("Asia/Kolkata")
                    .build();
            organization = organizationRepository.save(organization);
            organizationId = organization.getId();
        }

        final Organization savedOrganization = organization;
        Role ownerRole = roleRepository.findByNameAndOrganizationId(SystemRole.OWNER.name(), organizationId)
                .orElseGet(() -> createSystemRole(savedOrganization, SystemRole.OWNER));

        User user = User.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone())
                .organization(organization)
                .roles(Set.of(ownerRole))
                .status(UserStatus.ACTIVE)
                .build();
        user = userRepository.save(user);

        String accessToken = jwtService.generateToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);

        log.info("New organization and owner registered: {} ({})", organization.getName(), user.getEmail());

        return AuthResponse.of(accessToken, refreshToken, jwtService.getJwtProperties().getExpiration() / 1000, user);
    }

    private String generateOrganizationCode(String organizationName) {
        String base = organizationName.replaceAll("[^A-Z0-9]", "").toUpperCase();
        if (base.length() > 10) {
            base = base.substring(0, 10);
        }
        if (base.length() < 2) {
            base = "ORG";
        }
        String code = base;
        int suffix = 1;
        while (organizationRepository.existsByCode(code)) {
            code = base + String.format("%03d", suffix);
            suffix++;
        }
        return code;
    }

public AuthResponse login(LoginRequest request) {
        String organizationCode = request.getOrganizationCode().trim().toUpperCase();
        
        Organization organization = organizationRepository.findByCode(organizationCode)
                .orElseThrow(() -> new BusinessException("ORG_NOT_FOUND", "Organization not found: " + organizationCode));

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepository.findByEmailAndOrganizationId(request.getEmail(), organization.getId())
                .orElseThrow(() -> new UsernameNotFoundException("User not found in organization: " + request.getEmail()));

        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new BusinessException("ACCOUNT_INACTIVE", "Account is not active: " + user.getStatus());
        }

        if (!user.isAccountNonLocked()) {
            throw new BusinessException("ACCOUNT_LOCKED", "Account is temporarily locked");
        }

        String accessToken = jwtService.generateToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);

        user.setLastLoginAt(java.time.Instant.now());
        user.setFailedLoginAttempts(0);
        userRepository.save(user);

        log.info("User logged in: {} (org: {})", user.getEmail(), user.getOrganization().getId());

        return AuthResponse.of(accessToken, refreshToken, jwtService.getJwtProperties().getExpiration() / 1000, user);
    }

    public AuthResponse refreshToken(String refreshToken) {
        String userEmail = jwtService.extractUsername(refreshToken);
        String organizationIdStr = jwtService.extractOrganizationId(refreshToken);

        if (organizationIdStr == null) {
            throw new BusinessException("INVALID_REFRESH_TOKEN", "Refresh token missing organizationId claim");
        }

        UUID organizationId;
        try {
            organizationId = UUID.fromString(organizationIdStr);
        } catch (IllegalArgumentException e) {
            throw new BusinessException("INVALID_REFRESH_TOKEN", "Invalid organizationId in refresh token");
        }

        User user = userRepository.findByEmailAndOrganizationId(userEmail, organizationId)
                .orElseThrow(() -> new UsernameNotFoundException("User not found in organization: " + userEmail));

        UserDetails userDetails = new org.springframework.security.core.userdetails.User(
                user.getEmail(),
                user.getPasswordHash(),
                user.getRoles().stream()
                        .map(role -> new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_" + role.getName()))
                        .toList()
        );

        if (!jwtService.isTokenValid(refreshToken, userDetails)) {
            throw new BusinessException("INVALID_REFRESH_TOKEN", "Invalid or expired refresh token");
        }

        String newAccessToken = jwtService.generateToken(user);
        String newRefreshToken = jwtService.generateRefreshToken(user);

        return AuthResponse.of(newAccessToken, newRefreshToken, jwtService.getJwtProperties().getExpiration() / 1000, user);
    }

    private Role createSystemRole(Organization organization, SystemRole systemRole) {
        Role role = Role.builder()
                .name(systemRole.name())
                .description("System role: " + systemRole.name())
                .isSystemRole(true)
                .isActive(true)
                .organization(organization)
                .build();
        return roleRepository.save(role);
    }
}

