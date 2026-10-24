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

    public void calculateAmounts() {
        BigDecimal baseAmount = unitPrice.multiply(BigDecimal.valueOf(quantity));
        BigDecimal discount = baseAmount.multiply(discountRate.divide(BigDecimal.valueOf(100)));
        BigDecimal afterDiscount = baseAmount.subtract(discount);
        BigDecimal tax = afterDiscount.multiply(taxRate.divide(BigDecimal.valueOf(100)));
        this.lineTotal = afterDiscount.add(tax);
        this.costAmount = unitCost.multiply(BigDecimal.valueOf(quantity));
    }

    public BigDecimal getTaxAmount() {
        BigDecimal baseAmount = unitPrice.multiply(BigDecimal.valueOf(quantity));
        BigDecimal discount = baseAmount.multiply(discountRate.divide(BigDecimal.valueOf(100)));
        BigDecimal afterDiscount = baseAmount.subtract(discount);
        return afterDiscount.multiply(taxRate.divide(BigDecimal.valueOf(100)));
    }

    public BigDecimal getDiscountAmount() {
        BigDecimal baseAmount = unitPrice.multiply(BigDecimal.valueOf(quantity));
        return baseAmount.multiply(discountRate.divide(BigDecimal.valueOf(100)));
    }

    public BigDecimal getGrossProfit() {
        return lineTotal.subtract(costAmount);
    }

    public BigDecimal getGrossMarginPercent() {
        if (lineTotal.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        return getGrossProfit().divide(lineTotal, 4, java.math.RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100));
    }
}

