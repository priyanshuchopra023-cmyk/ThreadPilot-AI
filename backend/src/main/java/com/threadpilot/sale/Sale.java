package com.threadpilot.sale;

import com.threadpilot.common.util.BaseEntity;
import com.threadpilot.organization.Organization;
import com.threadpilot.customer.Customer;
import com.threadpilot.order.CustomerOrder;
import com.threadpilot.user.User;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "sales", indexes = {
    @Index(name = "idx_sales_org", columnList = "organization_id"),
    @Index(name = "idx_sales_customer", columnList = "customer_id"),
    @Index(name = "idx_sales_order", columnList = "order_id"),
    @Index(name = "idx_sales_date", columnList = "sale_date"),
    @Index(name = "idx_sales_number_org", columnList = "sale_number, organization_id", unique = true)
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Sale extends BaseEntity {

    @NotBlank
    @Size(max = 100)
    @Column(name = "sale_number", nullable = false)
    private String saleNumber;

    @NotNull
    @Column(name = "sale_date", nullable = false)
    private LocalDate saleDate;

    @NotNull
    @DecimalMin(value = "0.0")
    @Digits(integer = 12, fraction = 2)
    @Column(name = "subtotal", precision = 14, scale = 2, nullable = false)
    private BigDecimal subtotal = BigDecimal.ZERO;

    @NotNull
    @DecimalMin(value = "0.0")
    @Digits(integer = 10, fraction = 2)
    @Column(name = "tax_amount", precision = 12, scale = 2, nullable = false)
    private BigDecimal taxAmount = BigDecimal.ZERO;

    @NotNull
    @DecimalMin(value = "0.0")
    @Digits(integer = 10, fraction = 2)
    @Column(name = "discount_amount", precision = 12, scale = 2, nullable = false)
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @NotNull
    @DecimalMin(value = "0.0")
    @Digits(integer = 12, fraction = 2)
    @Column(name = "total_amount", precision = 14, scale = 2, nullable = false)
    private BigDecimal totalAmount = BigDecimal.ZERO;

    @NotNull
    @DecimalMin(value = "0.0")
    @Digits(integer = 12, fraction = 2)
    @Column(name = "cost_amount", precision = 14, scale = 2, nullable = false)
    private BigDecimal costAmount = BigDecimal.ZERO;

    @NotNull
    @DecimalMin(value = "0.0")
    @Digits(integer = 12, fraction = 2)
    @Column(name = "gross_profit", precision = 14, scale = 2, nullable = false)
    private BigDecimal grossProfit = BigDecimal.ZERO;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id")
    private Customer customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id")
    private CustomerOrder order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @OneToMany(mappedBy = "sale", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private Set<SaleItem> items = new HashSet<>();

    public void calculateTotals() {
        if (items == null || items.isEmpty()) {
            if (this.totalAmount == null) {
                this.totalAmount = BigDecimal.ZERO;
            }
            if (this.subtotal == null) {
                this.subtotal = this.totalAmount;
            }
            if (this.taxAmount == null) {
                this.taxAmount = BigDecimal.ZERO;
            }
            if (this.discountAmount == null) {
                this.discountAmount = BigDecimal.ZERO;
            }
            if (this.costAmount == null) {
                this.costAmount = BigDecimal.ZERO;
            }
            if (this.grossProfit == null) {
                this.grossProfit = this.totalAmount.subtract(this.costAmount);
            }
            return;
        }
        this.subtotal = items.stream()
                .map(SaleItem::getBaseAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, java.math.RoundingMode.HALF_UP);
        this.discountAmount = items.stream()
                .map(SaleItem::getDiscountAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, java.math.RoundingMode.HALF_UP);
        this.taxAmount = items.stream()
                .map(SaleItem::getTaxAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, java.math.RoundingMode.HALF_UP);
        this.totalAmount = subtotal.subtract(discountAmount).add(taxAmount).setScale(2, java.math.RoundingMode.HALF_UP);
        this.costAmount = items.stream()
                .map(SaleItem::getCostAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, java.math.RoundingMode.HALF_UP);
        this.grossProfit = totalAmount.subtract(costAmount).setScale(2, java.math.RoundingMode.HALF_UP);
    }

    public BigDecimal getGrossMarginPercent() {
        if (totalAmount.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        return grossProfit.divide(totalAmount, 4, java.math.RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100));
    }
}

