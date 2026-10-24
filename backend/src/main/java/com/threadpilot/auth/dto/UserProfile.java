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
public class UserProfile {

    private UserInfo user;
    private OrganizationInfo organization;

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
        private String gstNumber;
        private String panNumber;
        private String email;
        private String phone;
        private String address;
        private String city;
        private String state;
        private String postalCode;
        private String country;
        private String currency;
        private String timezone;
        private String logoUrl;

        public static OrganizationInfo from(Organization org) {
            return OrganizationInfo.builder()
                    .id(org.getId())
                    .name(org.getName())
                    .businessName(org.getBusinessName())
                    .gstNumber(org.getGstNumber())
                    .panNumber(org.getPanNumber())
                    .email(org.getEmail())
                    .phone(org.getPhone())
                    .address(org.getAddress())
                    .city(org.getCity())
                    .state(org.getState())
                    .postalCode(org.getPostalCode())
                    .country(org.getCountry())
                    .currency(org.getCurrency())
                    .timezone(org.getTimezone())
                    .logoUrl(org.getLogoUrl())
                    .build();
        }
    }
}