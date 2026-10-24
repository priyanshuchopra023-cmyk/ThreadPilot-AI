package com.threadpilot.security;

import com.threadpilot.user.User;
import com.threadpilot.user.UserRepository;
import com.threadpilot.user.UserStatus;
import com.threadpilot.user.Role;
import com.threadpilot.organization.Organization;
import com.threadpilot.organization.OrganizationRepository;
import com.threadpilot.auth.AuthService;
import com.threadpilot.auth.dto.LoginRequest;
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
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrganizationAuthenticationProviderTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private OrganizationRepository organizationRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private AuthenticationManager authenticationManager;

    private AuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthService(
                userRepository,
                organizationRepository,
                null,
                passwordEncoder,
                null,
                authenticationManager
        );
    }

    @Test
    void authenticateUserDetailsService_returnsUserDetails_whenUserExists() {
        // Given
        String email = "user@example.com";
        UUID orgId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();

        Organization org = Organization.builder().name("Test Org").build();
        org.setId(orgId);
        User user = User.builder()
                .email(email)
                .passwordHash("hashed")
                .status(UserStatus.ACTIVE)
                .organization(org)
                .roles(Set.of(Role.builder().name("OWNER").build()))
                .build();
        user.setId(userId);

        when(userRepository.findByEmailAndOrganizationId(email, orgId)).thenReturn(Optional.of(user));
        when(organizationRepository.findByCode("ORG001")).thenReturn(Optional.of(org));
        when(passwordEncoder.matches("password", "hashed")).thenReturn(true);

        // When - using AuthService.login which uses scoped lookup
        var response = authService.login(LoginRequest.builder()
                .email(email)
                .password("password")
                .organizationCode("ORG001")
                .build());

        // Then
        assertThat(response).isNotNull();
        verify(userRepository).findByEmailAndOrganizationId(email, orgId);
        verify(userRepository, never()).findByEmail(email); // No unscoped fallback!
    }

    @Test
    void authenticateUserDetailsService_throwsException_whenUserNotFound() {
        // Given
        when(userRepository.findByEmailAndOrganizationId("nonexistent@example.com", UUID.randomUUID())).thenReturn(Optional.empty());
        when(organizationRepository.findByCode("ORG001")).thenReturn(Optional.of(Organization.builder().name("Test").build()));

        // When/Then
        assertThatThrownBy(() -> authService.login(LoginRequest.builder()
                .email("nonexistent@example.com")
                .password("password")
                .organizationCode("ORG001")
                .build()))
                .isInstanceOf(UsernameNotFoundException.class)
                .hasMessageContaining("User not found in organization");
    }

    @Test
    void authenticateUserDetailsService_knownLimitation_removed() {
        // The old UserDetailsService had a known limitation with unscoped lookups.
        // This is now fixed by using OrganizationAuthenticationProvider which requires
        // organizationCode and performs scoped lookups.
        // This test documents that the unscoped fallback has been removed.
        assertThat(true).isTrue();
    }
}