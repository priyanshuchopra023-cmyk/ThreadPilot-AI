package com.threadpilot.inventory;

import com.threadpilot.common.util.BaseEntity;
import com.threadpilot.organization.Organization;
import com.threadpilot.product.Product;
import com.threadpilot.product.ProductVariant;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "inventory", indexes = {
    @Index(name = "idx_inventory_product_org", columnList = "product_id, organization_id", unique = true),
    @Index(name = "idx_inventory_variant_org", columnList = "variant_id, organization_id", unique = true),
    @Index(name = "idx_inventory_organization", columnList = "organization_id"),
    @Index(name = "idx_inventory_low_stock", columnList = "available_quantity")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Inventory extends BaseEntity {

    @NotNull
    @Min(0)
    @Column(name = "current_quantity", nullable = false)
    private Integer currentQuantity = 0;

    @NotNull
    @Min(0)
    @Column(name = "reserved_quantity", nullable = false)
    private Integer reservedQuantity = 0;

    @NotNull
    @Min(0)
    @Column(name = "available_quantity", nullable = false)
    private Integer availableQuantity = 0;

    @NotNull
    @Min(0)
    @Column(name = "incoming_quantity", nullable = false)
    private Integer incomingQuantity = 0;

    @NotNull
    @Min(0)
    @Column(name = "damaged_quantity", nullable = false)
    private Integer damagedQuantity = 0;

    @NotNull
    @Min(0)
    @Column(name = "returned_quantity", nullable = false)
    private Integer returnedQuantity = 0;

    @NotNull
    @DecimalMin(value = "0.0")
    @Digits(integer = 12, fraction = 2)
    @Column(name = "average_cost", precision = 12, scale = 2, nullable = false)
    private BigDecimal averageCost = BigDecimal.ZERO;

    @NotNull
    @DecimalMin(value = "0.0")
    @Digits(integer = 12, fraction = 2)
    @Column(name = "total_value", precision = 14, scale = 2, nullable = false)
    private BigDecimal totalValue = BigDecimal.ZERO;

    @Column(name = "last_movement_at")
    private java.time.Instant lastMovementAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "variant_id")
    private ProductVariant variant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    public void recalculateAvailable() {
        this.availableQuantity = this.currentQuantity - this.reservedQuantity;
    }

    public void recalculateTotalValue() {
        this.totalValue = this.averageCost.multiply(BigDecimal.valueOf(this.currentQuantity));
    }

    public boolean isLowStock(int threshold) {
        return availableQuantity <= threshold;
    }

    public boolean canReserve(int quantity) {
        return availableQuantity >= quantity;
    }

    public void reserve(int quantity) {
        if (!canReserve(quantity)) {
            throw new IllegalStateException("Insufficient available stock to reserve: " + quantity);
        }
        this.reservedQuantity += quantity;
        recalculateAvailable();
    }

    public void releaseReservation(int quantity) {
        this.reservedQuantity = Math.max(0, this.reservedQuantity - quantity);
        recalculateAvailable();
    }

    public void confirmSale(int quantity) {
        if (reservedQuantity < quantity) {
            throw new IllegalStateException("Cannot confirm sale: reserved quantity insufficient");
        }
        this.currentQuantity -= quantity;
        this.reservedQuantity -= quantity;
        recalculateAvailable();
        recalculateTotalValue();
    }
}

