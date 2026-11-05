package com.threadpilot.sale;

import com.threadpilot.common.util.BaseEntity;
import com.threadpilot.organization.Organization;
import com.threadpilot.product.Product;
import com.threadpilot.product.ProductVariant;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "sale_items", indexes = {
    @Index(name = "idx_sale_items_sale", columnList = "sale_id"),
    @Index(name = "idx_sale_items_product", columnList = "product_id"),
    @Index(name = "idx_sale_items_variant", columnList = "variant_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SaleItem extends BaseEntity {

    @NotNull
    @Min(1)
    @Column(name = "quantity", nullable = false)
    private Integer quantity;

    @NotNull
    @DecimalMin(value = "0.0", inclusive = false)
    @Digits(integer = 10, fraction = 2)
    @Column(name = "unit_price", precision = 12, scale = 2, nullable = false)
    private BigDecimal unitPrice;

    @NotNull
    @DecimalMin(value = "0.0")
    @Digits(integer = 10, fraction = 2)
    @Column(name = "unit_cost", precision = 12, scale = 2, nullable = false)
    private BigDecimal unitCost;

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

    @NotNull
    @DecimalMin(value = "0.0")
    @Digits(integer = 12, fraction = 2)
    @Column(name = "cost_amount", precision = 14, scale = 2, nullable = false)
    private BigDecimal costAmount;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sale_id", nullable = false)
    private Sale sale;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "variant_id")
    private ProductVariant variant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    public BigDecimal getBaseAmount() {
        if (unitPrice == null || quantity == null) return BigDecimal.ZERO;
        return unitPrice.multiply(BigDecimal.valueOf(quantity)).setScale(2, java.math.RoundingMode.HALF_UP);
    }

    public BigDecimal getDiscountAmount() {
        if (discountRate == null || discountRate.compareTo(BigDecimal.ZERO) <= 0) return BigDecimal.ZERO;
        return getBaseAmount().multiply(discountRate).divide(BigDecimal.valueOf(100), 2, java.math.RoundingMode.HALF_UP);
    }

    public BigDecimal getTaxAmount() {
        if (taxRate == null || taxRate.compareTo(BigDecimal.ZERO) <= 0) return BigDecimal.ZERO;
        BigDecimal taxable = getBaseAmount().subtract(getDiscountAmount());
        return taxable.multiply(taxRate).divide(BigDecimal.valueOf(100), 2, java.math.RoundingMode.HALF_UP);
    }

    public void calculateAmounts() {
        this.lineTotal = getBaseAmount().subtract(getDiscountAmount()).add(getTaxAmount()).setScale(2, java.math.RoundingMode.HALF_UP);
        BigDecimal cost = unitCost != null ? unitCost : BigDecimal.ZERO;
        this.costAmount = cost.multiply(BigDecimal.valueOf(quantity)).setScale(2, java.math.RoundingMode.HALF_UP);
    }

    public BigDecimal getGrossProfit() {
        return (lineTotal != null ? lineTotal : BigDecimal.ZERO).subtract(costAmount != null ? costAmount : BigDecimal.ZERO);
    }

    public BigDecimal getGrossMarginPercent() {
        if (lineTotal == null || lineTotal.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        return getGrossProfit().divide(lineTotal, 4, java.math.RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100)).setScale(2, java.math.RoundingMode.HALF_UP);
    }
}

