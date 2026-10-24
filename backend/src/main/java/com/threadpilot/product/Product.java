package com.threadpilot.product;

import com.threadpilot.common.util.BaseEntity;
import com.threadpilot.organization.Organization;
import com.threadpilot.supplier.Supplier;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "products", indexes = {
    @Index(name = "idx_products_sku_org", columnList = "sku, organization_id", unique = true),
    @Index(name = "idx_products_organization", columnList = "organization_id"),
    @Index(name = "idx_products_category", columnList = "category"),
    @Index(name = "idx_products_brand", columnList = "brand"),
    @Index(name = "idx_products_status", columnList = "status"),
    @Index(name = "idx_products_barcode", columnList = "barcode")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product extends BaseEntity {

    @NotBlank
    @Size(max = 100)
    @Column(name = "sku", nullable = false)
    private String sku;

    @NotBlank
    @Size(max = 200)
    @Column(name = "name", nullable = false)
    private String name;

    @Size(max = 100)
    @Column(name = "brand")
    private String brand;

    @Size(max = 100)
    @Column(name = "category")
    private String category;

    @Size(max = 100)
    @Column(name = "subcategory")
    private String subcategory;

    @Size(max = 50)
    @Column(name = "size")
    private String size;

    @Size(max = 50)
    @Column(name = "color")
    private String color;

    @Size(max = 50)
    @Column(name = "material")
    private String material;

    @Size(max = 20)
    @Column(name = "gender")
    private String gender;

    @Size(max = 20)
    @Column(name = "unit")
    private String unit;

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

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "image_url")
    private String imageUrl;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supplier_id")
    private Supplier supplier;

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private Set<ProductVariant> variants = new HashSet<>();

    public boolean hasVariants() {
        return variants != null && !variants.isEmpty();
    }
}

