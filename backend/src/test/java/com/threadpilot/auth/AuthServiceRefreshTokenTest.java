package com.threadpilot.auth;

import com.threadpilot.auth.dto.AuthResponse;
import com.threadpilot.auth.dto.LoginRequest;
import com.threadpilot.common.exception.BusinessException;
import com.threadpilot.organization.Organization;
import com.threadpilot.organization.OrganizationRepository;
import com.threadpilot.security.JwtProperties;
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
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceRefreshTokenTest {

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
    void refreshToken_returnsNewTokens_whenValidRefreshTokenWithOrganizationId() {
        // Given
        String refreshToken = "valid.refresh.token";
        String userEmail = "user@example.com";
        UUID organizationId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();

        when(jwtService.extractUsername(refreshToken)).thenReturn(userEmail);
        when(jwtService.extractOrganizationId(refreshToken)).thenReturn(organizationId.toString());

        Organization org = Organization.builder().name("Test Org").build();
        org.setId(organizationId);
        User user = User.builder()
                .email(userEmail)
                .passwordHash("hashed")
                .status(UserStatus.ACTIVE)
                .organization(org)
                .roles(Set.of(Role.builder().name("OWNER").build()))
                .build();
        user.setId(userId);

        when(userRepository.findByEmailAndOrganizationId(userEmail, organizationId))
                .thenReturn(Optional.of(user));
        when(jwtService.isTokenValid(eq(refreshToken), any(UserDetails.class))).thenReturn(true);
        JwtProperties jwtProperties = new JwtProperties();
        jwtProperties.setExpiration(3600000L);
        when(jwtService.getJwtProperties()).thenReturn(jwtProperties);
        when(jwtService.generateToken(user)).thenReturn("new.access.token");
        when(jwtService.generateRefreshToken(user)).thenReturn("new.refresh.token");

        // When
        AuthResponse response = authService.refreshToken(refreshToken);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getAccessToken()).isEqualTo("new.access.token");
        assertThat(response.getRefreshToken()).isEqualTo("new.refresh.token");
        verify(userRepository).findByEmailAndOrganizationId(userEmail, organizationId);
        verify(userRepository, never()).findByEmail(anyString()); // No unscoped fallback!
    }

    @Test
    void refreshToken_throwsException_whenRefreshTokenMissingOrganizationId() {
        // Given
        String refreshToken = "valid.refresh.token";
        String userEmail = "user@example.com";

        when(jwtService.extractUsername(refreshToken)).thenReturn(userEmail);
        when(jwtService.extractOrganizationId(refreshToken)).thenReturn(null);

        // When/Then
        assertThatThrownBy(() -> authService.refreshToken(refreshToken))
                .isInstanceOf(BusinessException.class)
                .satisfies(e -> assertThat(((BusinessException) e).getCode()).isEqualTo("INVALID_REFRESH_TOKEN"))
                .hasMessageContaining("Refresh token missing organizationId claim");

        verify(userRepository, never()).findByEmail(anyString());
        verify(userRepository, never()).findByEmailAndOrganizationId(anyString(), any());
    }

    @Test
    void refreshToken_throwsException_whenInvalidOrganizationIdInRefreshToken() {
        // Given
        String refreshToken = "valid.refresh.token";
        String userEmail = "user@example.com";

        when(jwtService.extractUsername(refreshToken)).thenReturn(userEmail);
        when(jwtService.extractOrganizationId(refreshToken)).thenReturn("not-a-valid-uuid");

        // When/Then
        assertThatThrownBy(() -> authService.refreshToken(refreshToken))
                .isInstanceOf(BusinessException.class)
                .satisfies(e -> assertThat(((BusinessException) e).getCode()).isEqualTo("INVALID_REFRESH_TOKEN"))
                .hasMessageContaining("Invalid organizationId in refresh token");

        verify(userRepository, never()).findByEmail(anyString());
        verify(userRepository, never()).findByEmailAndOrganizationId(anyString(), any());
    }

    @Test
    void refreshToken_throwsException_whenUserNotFoundInOrganization() {
        // Given
        UUID organizationId = UUID.randomUUID();
        String refreshToken = "valid.refresh.token";
        String userEmail = "user@example.com";

        when(jwtService.extractUsername(refreshToken)).thenReturn(userEmail);
        when(jwtService.extractOrganizationId(refreshToken)).thenReturn(organizationId.toString());
        when(userRepository.findByEmailAndOrganizationId(userEmail, organizationId))
                .thenReturn(Optional.empty());

        // When/Then
        assertThatThrownBy(() -> authService.refreshToken(refreshToken))
                .isInstanceOf(UsernameNotFoundException.class)
                .hasMessageContaining("User not found in organization");

        verify(userRepository).findByEmailAndOrganizationId(userEmail, organizationId);
        verify(userRepository, never()).findByEmail(anyString());
    }

    @Test
    void refreshToken_throwsException_whenTokenInvalid() {
        // Given
        String refreshToken = "invalid.token";
        String userEmail = "user@example.com";
        UUID organizationId = UUID.randomUUID();

        when(jwtService.extractUsername(refreshToken)).thenReturn(userEmail);
        when(jwtService.extractOrganizationId(refreshToken)).thenReturn(organizationId.toString());

        UUID userId = UUID.randomUUID();
        Organization org = Organization.builder().name("Test Org").build();
        org.setId(organizationId);
        User user = User.builder()
                .email(userEmail)
                .passwordHash("hashed")
                .status(UserStatus.ACTIVE)
                .organization(org)
                .roles(Set.of(Role.builder().name("OWNER").build()))
                .build();
        user.setId(userId);

        when(userRepository.findByEmailAndOrganizationId(userEmail, organizationId))
                .thenReturn(Optional.of(user));
        when(jwtService.isTokenValid(eq(refreshToken), any(UserDetails.class))).thenReturn(false);

        // When/Then
        assertThatThrownBy(() -> authService.refreshToken(refreshToken))
                .isInstanceOf(BusinessException.class)
                .satisfies(e -> assertThat(((BusinessException) e).getCode()).isEqualTo("INVALID_REFRESH_TOKEN"))
                .hasMessageContaining("Invalid or expired refresh token");
    }

    @Test
    void refreshToken_doesNotFallbackToUnscopedLookup() {
        // Given - simulate a token with invalid orgId format
        String refreshToken = "valid.refresh.token";
        String userEmail = "user@example.com";

        when(jwtService.extractUsername(refreshToken)).thenReturn(userEmail);
        when(jwtService.extractOrganizationId(refreshToken)).thenReturn("not-a-uuid");

        // When/Then
        assertThatThrownBy(() -> authService.refreshToken(refreshToken))
                .isInstanceOf(BusinessException.class);

        // Verify NO unscoped fallback occurred
        verify(userRepository, never()).findByEmail(anyString());
    }
}