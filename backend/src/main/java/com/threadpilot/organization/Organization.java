package com.threadpilot.organization;

import com.threadpilot.common.util.BaseEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "organizations", indexes = {
    @Index(name = "idx_organizations_name", columnList = "name"),
    @Index(name = "idx_organizations_gst_number", columnList = "gstNumber", unique = true),
    @Index(name = "idx_organizations_code", columnList = "code", unique = true)
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Organization extends BaseEntity {

    @NotBlank
    @Size(max = 200)
    @Column(name = "name", nullable = false)
    private String name;

    @Size(max = 200)
    @Column(name = "business_name")
    private String businessName;

    @Size(max = 50)
    @Column(name = "gst_number", unique = true)
    private String gstNumber;

    @Size(max = 20)
    @Column(name = "code", unique = true)
    private String code;

    @Size(max = 50)
    @Column(name = "pan_number")
    private String panNumber;

    @Email
    @Size(max = 100)
    @Column(name = "email")
    private String email;

    @Size(max = 20)
    @Column(name = "phone")
    private String phone;

    @Column(name = "address", columnDefinition = "TEXT")
    private String address;

    @Size(max = 100)
    @Column(name = "city")
    private String city;

    @Size(max = 100)
    @Column(name = "state")
    private String state;

    @Size(max = 20)
    @Column(name = "postal_code")
    private String postalCode;

    @Size(max = 100)
@Column(name = "country")
    private String country;

    @NotNull
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "settings")
    private String settings = "{}";

    @Column(name = "logo_url")
    private String logoUrl;

    @Column(name = "currency", length = 3)
    private String currency = "INR";

    @Column(name = "timezone")
    private String timezone = "Asia/Kolkata";
}

