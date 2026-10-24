package com.threadpilot.order;

import com.threadpilot.common.util.BaseEntity;
import com.threadpilot.organization.Organization;
import com.threadpilot.product.Product;
import com.threadpilot.product.ProductVariant;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "customer_order_items", indexes = {
    @Index(name = "idx_customer_order_items_order", columnList = "order_id"),
    @Index(name = "idx_customer_order_items_product", columnList = "product_id"),
    @Index(name = "idx_customer_order_items_variant", columnList = "variant_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustomerOrderItem extends BaseEntity {

    @NotNull
    @Min(1)
    @Column(name = "quantity", nullable = false)
    private Integer quantity;

    @NotNull
    @Min(0)
    @Column(name = "reserved_quantity", nullable = false)
    private Integer reservedQuantity = 0;

    @NotNull
    @Min(0)
    @Column(name = "fulfilled_quantity", nullable = false)
    private Integer fulfilledQuantity = 0;

    @NotNull
    @DecimalMin(value = "0.0", inclusive = false)
    @Digits(integer = 10, fraction = 2)
    @Column(name = "unit_price", precision = 12, scale = 2, nullable = false)
    private BigDecimal unitPrice;

    @NotNull
    @DecimalMin(value = "0.0")
    @Digits(integer = 10, fraction = 2)
    @Column(name = "tax_rate", precision = 5, scale = 2, nullable = false)
    private BigDecimal taxRate = BigDecimal.ZERO;

    @NotNull
    @DecimalMin(value = "0.0")
    @Digits(integer = 10, fraction = 2)
    @Column(name = "discount_rate", precision = 5, scale = 2, nullable = false)
    private BigDecimal discountRate = BigDecimal.ZERO;

    @NotNull
    @DecimalMin(value = "0.0")
    @Digits(integer = 12, fraction = 2)
    @Column(name = "line_total", precision = 14, scale = 2, nullable = false)
    private BigDecimal lineTotal;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private CustomerOrder order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "variant_id")
    private ProductVariant variant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    public void calculateLineTotal() {
        BigDecimal baseAmount = unitPrice.multiply(BigDecimal.valueOf(quantity));
        BigDecimal discount = baseAmount.multiply(discountRate.divide(BigDecimal.valueOf(100)));
        BigDecimal afterDiscount = baseAmount.subtract(discount);
        BigDecimal tax = afterDiscount.multiply(taxRate.divide(BigDecimal.valueOf(100)));
        this.lineTotal = afterDiscount.add(tax);
    }

    public int getPendingQuantity() {
        return quantity - fulfilledQuantity;
    }

    public boolean isReserved() {
        return reservedQuantity >= quantity;
    }

    public boolean isFulfilled() {
        return fulfilledQuantity >= quantity;
    }

    public void reserve(int qty) {
        this.reservedQuantity = Math.min(this.reservedQuantity + qty, quantity);
    }

    public void releaseReservation(int qty) {
        this.reservedQuantity = Math.max(0, this.reservedQuantity - qty);
    }

    public void fulfill(int qty) {
        this.fulfilledQuantity = Math.min(this.fulfilledQuantity + qty, quantity);
    }
}

