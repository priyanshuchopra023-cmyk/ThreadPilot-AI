package com.threadpilot.supplier;

import com.threadpilot.common.util.BaseEntity;
import com.threadpilot.organization.Organization;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "suppliers", indexes = {
    @Index(name = "idx_suppliers_name_org", columnList = "name, organization_id"),
    @Index(name = "idx_suppliers_organization", columnList = "organization_id"),
    @Index(name = "idx_suppliers_gst", columnList = "gstNumber"),
    @Index(name = "idx_suppliers_status", columnList = "status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Supplier extends BaseEntity {

    @NotBlank
    @Size(max = 200)
    @Column(name = "name", nullable = false)
    private String name;

    @Size(max = 200)
    @Column(name = "company_name")
    private String companyName;

    @Size(max = 20)
    @Column(name = "phone")
    private String phone;

    @Email
    @Size(max = 150)
    @Column(name = "email")
    private String email;

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

    @Size(max = 50)
    @Column(name = "gst_number")
    private String gstNumber;

    @Size(max = 50)
    @Column(name = "pan_number")
    private String panNumber;

    @Size(max = 100)
    @Column(name = "payment_terms")
    private String paymentTerms;

    @NotNull
    @DecimalMin(value = "0.0")
    @Digits(integer = 12, fraction = 2)
    @Column(name = "outstanding_amount", precision = 14, scale = 2, nullable = false)
    private BigDecimal outstandingAmount = BigDecimal.ZERO;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private SupplierStatus status = SupplierStatus.ACTIVE;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;
}

