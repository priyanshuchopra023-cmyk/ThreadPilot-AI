package com.threadpilot.security;

import com.threadpilot.common.exception.BusinessException;
import com.threadpilot.organization.Organization;
import com.threadpilot.organization.OrganizationRepository;
import com.threadpilot.user.Role;
import com.threadpilot.user.User;
import com.threadpilot.user.UserRepository;
import com.threadpilot.user.UserStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class UserDetailsServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private OrganizationRepository organizationRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    private OrganizationAuthenticationProvider provider;

    @BeforeEach
    void setUp() {
        provider = new OrganizationAuthenticationProvider(
                userRepository,
                organizationRepository,
                passwordEncoder
        );
    }

    @Test
    void authenticate_returnsAuthenticatedToken_whenValidCredentials() {
        // Given
        String email = "user@example.com";
        String password = "password123";
        String orgCode = "ORG001";
        UUID orgId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();

        Organization org = Organization.builder().name("Test Org").code(orgCode).build();
        org.setId(orgId);
        User user = User.builder()
                .email(email)
                .passwordHash("hashed")
                .status(UserStatus.ACTIVE)
                .organization(org)
                .roles(Set.of(Role.builder().name("OWNER").build()))
                .build();
        user.setId(userId);

        when(organizationRepository.findByCode(orgCode)).thenReturn(Optional.of(org));
        when(userRepository.findByEmailAndOrganizationId(email, orgId)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(password, "hashed")).thenReturn(true);

        OrganizationUsernamePasswordAuthenticationToken inputToken =
                new OrganizationUsernamePasswordAuthenticationToken(email, password, orgCode);

        // When
        Authentication result = provider.authenticate(inputToken);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.isAuthenticated()).isTrue();
        assertThat(result.getPrincipal()).isEqualTo(user);
        verify(userRepository).findByEmailAndOrganizationId(email, orgId);
        verify(userRepository, never()).findByEmail(anyString()); // No unscoped fallback!
    }

    @Test
    void authenticate_throwsBadCredentialsException_whenUserNotFound() {
        // Given
        String email = "nonexistent@example.com";
        String orgCode = "ORG001";
        UUID orgId = UUID.randomUUID();
        Organization org = Organization.builder().name("Test Org").code(orgCode).build();
        org.setId(orgId);

        when(organizationRepository.findByCode(orgCode)).thenReturn(Optional.of(org));
        when(userRepository.findByEmailAndOrganizationId(email, orgId)).thenReturn(Optional.empty());

        OrganizationUsernamePasswordAuthenticationToken inputToken =
                new OrganizationUsernamePasswordAuthenticationToken(email, "password", orgCode);

        // When/Then
        assertThatThrownBy(() -> provider.authenticate(inputToken))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessageContaining("Invalid credentials");
    }

    @Test
    void authenticate_throwsBusinessException_whenOrganizationNotFound() {
        // Given
        when(organizationRepository.findByCode("UNKNOWN")).thenReturn(Optional.empty());

        OrganizationUsernamePasswordAuthenticationToken inputToken =
                new OrganizationUsernamePasswordAuthenticationToken("user@example.com", "password", "UNKNOWN");

        // When/Then
        assertThatThrownBy(() -> provider.authenticate(inputToken))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Organization not found");
    }

    @Test
    void authenticate_throwsBadCredentialsException_whenOrganizationCodeMissing() {
        OrganizationUsernamePasswordAuthenticationToken inputToken =
                new OrganizationUsernamePasswordAuthenticationToken("user@example.com", "password", "");

        assertThatThrownBy(() -> provider.authenticate(inputToken))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessageContaining("Organization code is required");
    }

    @Test
    void authenticate_throwsBadCredentialsException_whenPasswordMismatch() {
        // Given
        String email = "user@example.com";
        String orgCode = "ORG001";
        UUID orgId = UUID.randomUUID();
        Organization org = Organization.builder().name("Test Org").code(orgCode).build();
        org.setId(orgId);

        User user = User.builder()
                .email(email)
                .passwordHash("hashed")
                .status(UserStatus.ACTIVE)
                .organization(org)
                .roles(Set.of(Role.builder().name("OWNER").build()))
                .build();

        when(organizationRepository.findByCode(orgCode)).thenReturn(Optional.of(org));
        when(userRepository.findByEmailAndOrganizationId(email, orgId)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrongpassword", "hashed")).thenReturn(false);

        OrganizationUsernamePasswordAuthenticationToken inputToken =
                new OrganizationUsernamePasswordAuthenticationToken(email, "wrongpassword", orgCode);

        // When/Then
        assertThatThrownBy(() -> provider.authenticate(inputToken))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessageContaining("Invalid credentials");
    }

    @Test
    void authenticate_throwsBusinessException_whenAccountInactive() {
        // Given
        String email = "user@example.com";
        String orgCode = "ORG001";
        UUID orgId = UUID.randomUUID();
        Organization org = Organization.builder().name("Test Org").code(orgCode).build();
        org.setId(orgId);

        User user = User.builder()
                .email(email)
                .passwordHash("hashed")
                .status(UserStatus.INACTIVE)
                .organization(org)
                .roles(Set.of(Role.builder().name("OWNER").build()))
                .build();

        when(organizationRepository.findByCode(orgCode)).thenReturn(Optional.of(org));
        when(userRepository.findByEmailAndOrganizationId(email, orgId)).thenReturn(Optional.of(user));

        OrganizationUsernamePasswordAuthenticationToken inputToken =
                new OrganizationUsernamePasswordAuthenticationToken(email, "password", orgCode);

        // When/Then
        assertThatThrownBy(() -> provider.authenticate(inputToken))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Account is not active");
    }

    @Test
    void authenticate_throwsBusinessException_whenAccountLocked() {
        // Given
        String email = "user@example.com";
        String orgCode = "ORG001";
        UUID orgId = UUID.randomUUID();
        Organization org = Organization.builder().name("Test Org").code(orgCode).build();
        org.setId(orgId);

        User user = User.builder()
                .email(email)
                .passwordHash("hashed")
                .status(UserStatus.ACTIVE)
                .organization(org)
                .roles(Set.of(Role.builder().name("OWNER").build()))
                .lockedUntil(Instant.now().plusSeconds(3600))
                .build();

        when(organizationRepository.findByCode(orgCode)).thenReturn(Optional.of(org));
        when(userRepository.findByEmailAndOrganizationId(email, orgId)).thenReturn(Optional.of(user));

        OrganizationUsernamePasswordAuthenticationToken inputToken =
                new OrganizationUsernamePasswordAuthenticationToken(email, "password", orgCode);

        // When/Then
        assertThatThrownBy(() -> provider.authenticate(inputToken))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Account is temporarily locked");
    }

    @Test
    void supports_returnsTrueOnlyForOrganizationToken() {
        assertThat(provider.supports(OrganizationUsernamePasswordAuthenticationToken.class)).isTrue();
        assertThat(provider.supports(UsernamePasswordAuthenticationToken.class)).isFalse();
    }
}
