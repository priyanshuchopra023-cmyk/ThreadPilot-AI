package com.threadpilot.auth.dto;

import com.threadpilot.user.User;
import com.threadpilot.organization.Organization;
import lombok.*;

import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthResponse {

    private String accessToken;
    private String refreshToken;
    private String tokenType = "Bearer";
    private long expiresIn;
    private UserInfo user;
    private OrganizationInfo organization;

    public static AuthResponse of(String accessToken, String refreshToken, long expiresIn, User user) {
        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .expiresIn(expiresIn)
                .user(UserInfo.from(user))
                .organization(OrganizationInfo.from(user.getOrganization()))
                .build();
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UserInfo {
        private UUID id;
        private String firstName;
        private String lastName;
        private String email;
        private String phone;
        private String status;
        private Set<String> roles;
        private String avatarUrl;

        public static UserInfo from(User user) {
            return UserInfo.builder()
                    .id(user.getId())
                    .firstName(user.getFirstName())
                    .lastName(user.getLastName())
                    .email(user.getEmail())
                    .phone(user.getPhone())
                    .status(user.getStatus().name())
                    .roles(user.getRoles().stream().map(r -> r.getName()).collect(Collectors.toSet()))
                    .avatarUrl(user.getAvatarUrl())
                    .build();
        }
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class OrganizationInfo {
        private UUID id;
        private String name;
        private String businessName;
        private String currency;
        private String timezone;

        public static OrganizationInfo from(Organization org) {
            return OrganizationInfo.builder()
                    .id(org.getId())
                    .name(org.getName())
                    .businessName(org.getBusinessName())
                    .currency(org.getCurrency())
                    .timezone(org.getTimezone())
                    .build();
        }
    }
}

