package com.threadpilot.product;

import com.threadpilot.common.util.BaseEntity;
import com.threadpilot.organization.Organization;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "product_variants", indexes = {
    @Index(name = "idx_product_variants_sku_org", columnList = "sku, organization_id", unique = true),
    @Index(name = "idx_product_variants_product", columnList = "product_id"),
    @Index(name = "idx_product_variants_organization", columnList = "organization_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductVariant extends BaseEntity {

    @NotBlank
    @Size(max = 100)
    @Column(name = "sku", nullable = false)
    private String sku;

    @Size(max = 50)
    @Column(name = "size")
    private String size;

    @Size(max = 50)
    @Column(name = "color")
    private String color;

    @NotNull
    @DecimalMin(value = "0.0", inclusive = false)
    @Digits(integer = 10, fraction = 2)
    @Column(name = "purchase_price", precision = 12, scale = 2, nullable = false)
    private BigDecimal purchasePrice;

    @NotNull
    @DecimalMin(value = "0.0", inclusive = false)
    @Digits(integer = 10, fraction = 2)
    @Column(name = "selling_price", precision = 12, scale = 2, nullable = false)
    private BigDecimal sellingPrice;

    @NotNull
    @Min(0)
    @Column(name = "min_stock_level", nullable = false)
    private Integer minStockLevel = 0;

    @NotNull
    @Min(0)
    @Column(name = "reorder_quantity", nullable = false)
    private Integer reorderQuantity = 0;

    @Size(max = 50)
    @Column(name = "barcode")
    private String barcode;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private ProductStatus status = ProductStatus.ACTIVE;

    @Column(name = "image_url")
    private String imageUrl;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;
}

