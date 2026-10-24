package com.threadpilot.inventory;

import com.threadpilot.common.util.BaseEntity;
import com.threadpilot.organization.Organization;
import com.threadpilot.product.Product;
import com.threadpilot.product.ProductVariant;
import com.threadpilot.supplier.Supplier;
import com.threadpilot.customer.Customer;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "stock_movements", indexes = {
    @Index(name = "idx_stock_movements_organization", columnList = "organization_id"),
    @Index(name = "idx_stock_movements_product", columnList = "product_id"),
    @Index(name = "idx_stock_movements_variant", columnList = "variant_id"),
    @Index(name = "idx_stock_movements_type", columnList = "movementType"),
    @Index(name = "idx_stock_movements_reference", columnList = "referenceType, referenceId"),
    @Index(name = "idx_stock_movements_created_at", columnList = "created_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StockMovement extends BaseEntity {

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "movement_type", nullable = false, length = 30)
    private MovementType movementType;

    @NotNull
    @Min(1)
    @Column(name = "quantity", nullable = false)
    private Integer quantity;

    @NotNull
    @Min(0)
    @Column(name = "quantity_before", nullable = false)
    private Integer quantityBefore;

    @NotNull
    @Min(0)
    @Column(name = "quantity_after", nullable = false)
    private Integer quantityAfter;

    @DecimalMin(value = "0.0")
    @Digits(integer = 10, fraction = 2)
    @Column(name = "unit_cost", precision = 12, scale = 2)
    private BigDecimal unitCost;

    @Size(max = 50)
    @Column(name = "reference_type")
    private String referenceType;

    @Column(name = "reference_id")
    private java.util.UUID referenceId;

    @Size(max = 100)
    @Column(name = "reference_number")
    private String referenceNumber;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "variant_id")
    private ProductVariant variant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supplier_id")
    private Supplier supplier;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id")
    private Customer customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private com.threadpilot.user.User createdBy;
}

