package com.threadpilot.security;

import com.threadpilot.user.User;
import com.threadpilot.user.UserStatus;
import com.threadpilot.user.UserRepository;
import com.threadpilot.organization.Organization;
import com.threadpilot.user.Role;
import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class JwtAuthenticationFilterTest {

    @Mock
    private JwtService jwtService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    @Mock
    private FilterChain filterChain;

    @Captor
    private ArgumentCaptor<Authentication> authCaptor;

    private JwtAuthenticationFilter filter;

    @BeforeEach
    void setUp() {
        filter = new JwtAuthenticationFilter(jwtService, userRepository);
        SecurityContextHolder.clearContext();
    }

    @Test
    void doFilterInternal_authenticatesUser_whenValidJwtAndUserExistsInOrganization() throws Exception {
        // Given
        UUID orgId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        String email = "user@example.com";
        String jwt = "valid.jwt.token";

        when(request.getHeader("Authorization")).thenReturn("Bearer " + jwt);
        when(jwtService.extractUsername(jwt)).thenReturn(email);
        when(jwtService.extractOrganizationId(jwt)).thenReturn(orgId.toString());

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
        when(jwtService.isTokenValid(anyString(), any())).thenReturn(true);
        when(jwtService.extractOrganizationId(jwt)).thenReturn(orgId.toString());

        // When
        filter.doFilterInternal(request, response, filterChain);

        // Then
        verify(filterChain).doFilter(request, response);
        verify(userRepository).findByEmailAndOrganizationId(email, orgId);
        verifyNoMoreInteractions(userRepository);

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        assertThat(auth).isNotNull();
        assertThat(auth.getPrincipal()).isEqualTo(email);
    }

    @Test
    void doFilterInternal_rejectsAuthentication_whenOrganizationIdMissingFromJwt() throws Exception {
        // Given
        String email = "user@example.com";
        String jwt = "valid.jwt.token";

        when(request.getHeader("Authorization")).thenReturn("Bearer " + jwt);
        when(jwtService.extractUsername(jwt)).thenReturn(email);
        when(jwtService.extractOrganizationId(jwt)).thenReturn(null);

        // When
        filter.doFilterInternal(request, response, filterChain);

        // Then
        verify(filterChain).doFilter(request, response);
        verifyNoInteractions(userRepository);
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }

    @Test
    void doFilterInternal_rejectsAuthentication_whenInvalidOrganizationIdInJwt() throws Exception {
        // Given
        String email = "user@example.com";
        String jwt = "valid.jwt.token";

        when(request.getHeader("Authorization")).thenReturn("Bearer " + jwt);
        when(jwtService.extractUsername(jwt)).thenReturn(email);
        when(jwtService.extractOrganizationId(jwt)).thenReturn("not-a-valid-uuid");

        // When
        filter.doFilterInternal(request, response, filterChain);

        // Then
        verify(filterChain).doFilter(request, response);
        verifyNoInteractions(userRepository);
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }

    @Test
    void doFilterInternal_rejectsAuthentication_whenUserNotFoundInOrganization() throws Exception {
        // Given
        UUID orgId = UUID.randomUUID();
        String email = "user@example.com";
        String jwt = "valid.jwt.token";

        when(request.getHeader("Authorization")).thenReturn("Bearer " + jwt);
        when(jwtService.extractUsername(jwt)).thenReturn(email);
        when(jwtService.extractOrganizationId(jwt)).thenReturn(orgId.toString());
        when(userRepository.findByEmailAndOrganizationId(email, orgId)).thenReturn(Optional.empty());

        // When
        filter.doFilterInternal(request, response, filterChain);

        // Then
        verify(filterChain).doFilter(request, response);
        verify(userRepository).findByEmailAndOrganizationId(email, orgId);
        verify(userRepository, never()).findByEmail(anyString());
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }

    @Test
    void doFilterInternal_doesNotFallbackToUnscopedLookup_whenScopedLookupFails() throws Exception {
        // Given
        UUID orgId = UUID.randomUUID();
        String email = "user@example.com";
        String jwt = "valid.jwt.token";

        when(request.getHeader("Authorization")).thenReturn("Bearer " + jwt);
        when(jwtService.extractUsername(jwt)).thenReturn(email);
        when(jwtService.extractOrganizationId(jwt)).thenReturn(orgId.toString());
        when(userRepository.findByEmailAndOrganizationId(email, orgId)).thenReturn(Optional.empty());

        // When
        filter.doFilterInternal(request, response, filterChain);

        // Then
        verify(filterChain).doFilter(request, response);
        verify(userRepository).findByEmailAndOrganizationId(email, orgId);
        verify(userRepository, never()).findByEmail(anyString()); // No fallback!
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }

    @Test
    void doFilterInternal_skipsAuthentication_whenNoAuthHeader() throws Exception {
        // Given
        when(request.getHeader("Authorization")).thenReturn(null);

        // When
        filter.doFilterInternal(request, response, filterChain);

        // Then
        verify(filterChain).doFilter(request, response);
        verifyNoInteractions(userRepository, jwtService);
    }

    @Test
    void doFilterInternal_skipsAuthentication_whenAuthHeaderNotBearer() throws Exception {
        // Given
        when(request.getHeader("Authorization")).thenReturn("Basic abc123");

        // When
        filter.doFilterInternal(request, response, filterChain);

        // Then
        verify(filterChain).doFilter(request, response);
        verifyNoInteractions(userRepository, jwtService);
    }

    @Test
    void doFilterInternal_skipsAuthentication_whenAlreadyAuthenticated() throws Exception {
        // Given
        String email = "user@example.com";
        String jwt = "valid.jwt.token";
        UUID orgId = UUID.randomUUID();

        when(request.getHeader("Authorization")).thenReturn("Bearer " + jwt);
        when(jwtService.extractUsername(jwt)).thenReturn(email);
        when(jwtService.extractOrganizationId(jwt)).thenReturn(orgId.toString());

        // Pre-authenticate
        Authentication existingAuth = mock(Authentication.class);
        SecurityContextHolder.getContext().setAuthentication(existingAuth);

        // When
        filter.doFilterInternal(request, response, filterChain);

        // Then
        verify(filterChain).doFilter(request, response);
        verifyNoInteractions(userRepository, jwtService);
    }
}