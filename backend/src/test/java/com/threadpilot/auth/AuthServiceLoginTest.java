package com.threadpilot.auth;

import com.threadpilot.auth.dto.AuthResponse;
import com.threadpilot.auth.dto.LoginRequest;
import com.threadpilot.common.exception.BusinessException;
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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceLoginTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private OrganizationRepository organizationRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @Mock
    private AuthenticationManager authenticationManager;

    private AuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthService(
                userRepository,
                organizationRepository,
                roleRepository,
                passwordEncoder,
                jwtService,
                authenticationManager
        );
    }

    @Test
    void login_returnsTokens_whenValidCredentials() {
        // Given
        LoginRequest request = LoginRequest.builder()
                .email("user@example.com")
                .password("password123")
                .organizationCode("ORG001")
                .build();

        UUID orgId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();

        Organization org = Organization.builder().name("Test Org").build();
        org.setId(orgId);
        User user = User.builder()
                .email("user@example.com")
                .passwordHash("hashed")
                .status(UserStatus.ACTIVE)
                .organization(org)
                .roles(Set.of(Role.builder().name("OWNER").build()))
                .build();
        user.setId(userId);

        when(authenticationManager.authenticate(any())).thenReturn(null);
        when(organizationRepository.findByCode("ORG001")).thenReturn(Optional.of(org));
        when(userRepository.findByEmailAndOrganizationId("user@example.com", orgId)).thenReturn(Optional.of(user));
        when(jwtService.generateToken(user)).thenReturn("access.token");
        when(jwtService.generateRefreshToken(user)).thenReturn("refresh.token");
        when(jwtService.getJwtProperties().getExpiration()).thenReturn(3600000L);

        // When
        AuthResponse response = authService.login(request);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getAccessToken()).isEqualTo("access.token");
        assertThat(response.getRefreshToken()).isEqualTo("refresh.token");
        verify(organizationRepository).findByCode("ORG001");
        verify(userRepository).findByEmailAndOrganizationId("user@example.com", orgId);
        verify(userRepository, never()).findByEmail(anyString()); // No unscoped fallback!
    }

    @Test
    void login_throwsException_whenOrganizationNotFound() {
        // Given
        LoginRequest request = LoginRequest.builder()
                .email("user@example.com")
                .password("password123")
                .organizationCode("INVALID")
                .build();

        when(organizationRepository.findByCode("INVALID")).thenReturn(Optional.empty());

        // When/Then
        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("ORG_NOT_FOUND");
    }

    @Test
    void login_throwsException_whenUserNotFoundInOrganization() {
        // Given
        LoginRequest request = LoginRequest.builder()
                .email("user@example.com")
                .password("password123")
                .organizationCode("ORG001")
                .build();

        UUID orgId = UUID.randomUUID();

        Organization org = Organization.builder().name("Test Org").build();
        org.setId(orgId);

        when(organizationRepository.findByCode("ORG001")).thenReturn(Optional.of(org));
        when(userRepository.findByEmailAndOrganizationId("user@example.com", orgId)).thenReturn(Optional.empty());

        // When/Then
        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(UsernameNotFoundException.class)
                .hasMessageContaining("User not found in organization");
    }

    @Test
    void login_throwsException_whenAccountInactive() {
        // Given
        LoginRequest request = LoginRequest.builder()
                .email("user@example.com")
                .password("password123")
                .organizationCode("ORG001")
                .build();

        UUID orgId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();

        Organization org = Organization.builder().name("Test Org").build();
        org.setId(orgId);
        User user = User.builder()
                .email("user@example.com")
                .passwordHash("hashed")
                .status(UserStatus.INACTIVE)
                .organization(org)
                .roles(Set.of(Role.builder().name("OWNER").build()))
                .build();
        user.setId(userId);

        when(organizationRepository.findByCode("ORG001")).thenReturn(Optional.of(org));
        when(userRepository.findByEmailAndOrganizationId("user@example.com", orgId)).thenReturn(Optional.of(user));

        // When/Then
        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("ACCOUNT_INACTIVE");
    }

    @Test
    void login_throwsException_whenAccountLocked() {
        // Given
        LoginRequest request = LoginRequest.builder()
                .email("user@example.com")
                .password("password123")
                .organizationCode("ORG001")
                .build();

        UUID orgId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();

        Organization org = Organization.builder().name("Test Org").build();
        org.setId(orgId);
        User user = User.builder()
                .email("user@example.com")
                .passwordHash("hashed")
                .status(UserStatus.ACTIVE)
                .organization(org)
                .roles(Set.of(Role.builder().name("OWNER").build()))
                .lockedUntil(java.time.Instant.now().plusSeconds(3600))
                .build();
        user.setId(userId);

        when(organizationRepository.findByCode("ORG001")).thenReturn(Optional.of(org));
        when(userRepository.findByEmailAndOrganizationId("user@example.com", orgId)).thenReturn(Optional.of(user));

        // When/Then
        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("ACCOUNT_LOCKED");
    }
}