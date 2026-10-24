package com.threadpilot.product;

import com.threadpilot.common.dto.PageResponse;
import com.threadpilot.common.dto.PaginationRequest;
import com.threadpilot.common.exception.BusinessException;
import com.threadpilot.common.exception.ResourceNotFoundException;
import com.threadpilot.inventory.Inventory;
import com.threadpilot.inventory.InventoryRepository;
import com.threadpilot.organization.Organization;
import com.threadpilot.security.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductService {

    private final ProductRepository productRepository;
    private final ProductVariantRepository variantRepository;
    private final InventoryRepository inventoryRepository;

    @Transactional(readOnly = true)
    public PageResponse<Product> getAll(PaginationRequest request) {
        UUID orgId = TenantContext.requireTenantId();
        Page<Product> page = productRepository.findActiveByOrganizationId(orgId, request.toPageable());
        return PageResponse.of(page);
    }

    @Transactional(readOnly = true)
    public PageResponse<Product> search(String term, PaginationRequest request) {
        UUID orgId = TenantContext.requireTenantId();
        Page<Product> page = productRepository.search(orgId, term, request.toPageable());
        return PageResponse.of(page);
    }

    @Transactional(readOnly = true)
    public Product getById(UUID id) {
        UUID orgId = TenantContext.requireTenantId();
        return productRepository.findById(id)
                .filter(p -> p.getOrganization().getId().equals(orgId))
                .orElseThrow(() -> new ResourceNotFoundException("Product", id));
    }

    @Transactional(readOnly = true)
    public Product getBySku(String sku) {
        UUID orgId = TenantContext.requireTenantId();
        return productRepository.findBySkuAndOrganizationId(sku, orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "sku", sku));
    }

    @Transactional(readOnly = true)
    public List<Product> getByCategory(String category) {
        UUID orgId = TenantContext.requireTenantId();
        return productRepository.findByCategory(orgId, category);
    }

    @Transactional(readOnly = true)
    public List<Product> getByBrand(String brand) {
        UUID orgId = TenantContext.requireTenantId();
        return productRepository.findByBrand(orgId, brand);
    }

    @Transactional
    public Product create(Product product) {
        UUID orgId = TenantContext.requireTenantId();

        if (productRepository.existsBySkuAndOrganizationId(product.getSku(), orgId)) {
            throw new BusinessException("CONFLICT", "Product with SKU " + product.getSku() + " already exists");
        }

        if (product.getBarcode() != null && productRepository.findByBarcode(orgId, product.getBarcode()).isPresent()) {
            throw new BusinessException("CONFLICT", "Product with barcode " + product.getBarcode() + " already exists");
        }

        Organization organization = new Organization();
        organization.setId(orgId);
        product.setOrganization(organization);
        product = productRepository.save(product);

        Inventory inventory = Inventory.builder()
                .product(product)
                .organization(organization)
                .currentQuantity(0)
                .reservedQuantity(0)
                .availableQuantity(0)
                .incomingQuantity(0)
                .damagedQuantity(0)
                .returnedQuantity(0)
                .averageCost(BigDecimal.ZERO)
                .totalValue(BigDecimal.ZERO)
                .build();
        inventoryRepository.save(inventory);

        log.info("Created product: {} ({})", product.getName(), product.getSku());
        return product;
    }

    @Transactional
    public Product update(UUID id, Product product) {
        UUID orgId = TenantContext.requireTenantId();
        Product existing = getById(id);

        if (!existing.getSku().equals(product.getSku()) &&
                productRepository.existsBySkuAndOrganizationIdAndIdNot(product.getSku(), orgId, id)) {
            throw new BusinessException("CONFLICT", "Product with SKU " + product.getSku() + " already exists");
        }

        if (product.getBarcode() != null && !product.getBarcode().equals(existing.getBarcode()) &&
                productRepository.findByBarcode(orgId, product.getBarcode()).isPresent()) {
            throw new BusinessException("CONFLICT", "Product with barcode " + product.getBarcode() + " already exists");
        }

        existing.setName(product.getName());
        existing.setBrand(product.getBrand());
        existing.setCategory(product.getCategory());
        existing.setSubcategory(product.getSubcategory());
        existing.setSize(product.getSize());
        existing.setColor(product.getColor());
        existing.setMaterial(product.getMaterial());
        existing.setGender(product.getGender());
        existing.setUnit(product.getUnit());
        existing.setPurchasePrice(product.getPurchasePrice());
        existing.setSellingPrice(product.getSellingPrice());
        existing.setMinStockLevel(product.getMinStockLevel());
        existing.setReorderQuantity(product.getReorderQuantity());
        existing.setBarcode(product.getBarcode());
        existing.setStatus(product.getStatus());
        existing.setDescription(product.getDescription());
        existing.setImageUrl(product.getImageUrl());
        existing.setSupplier(product.getSupplier());

        return productRepository.save(existing);
    }

    @Transactional
    public void delete(UUID id) {
        UUID orgId = TenantContext.requireTenantId();
        Product product = getById(id);
        productRepository.delete(product);
        log.info("Deleted product: {} ({})", product.getName(), product.getSku());
    }

    // Variant methods
    @Transactional(readOnly = true)
    public PageResponse<ProductVariant> getVariants(UUID productId, PaginationRequest request) {
        UUID orgId = TenantContext.requireTenantId();
        Product product = getById(productId);
        Page<ProductVariant> page = variantRepository.findActiveByProductId(productId, request.toPageable());
        return PageResponse.of(page);
    }

    @Transactional(readOnly = true)
    public ProductVariant getVariantById(UUID id) {
        UUID orgId = TenantContext.requireTenantId();
        return variantRepository.findById(id)
                .filter(v -> v.getOrganization().getId().equals(orgId))
                .orElseThrow(() -> new ResourceNotFoundException("ProductVariant", id));
    }

    @Transactional
    public ProductVariant createVariant(UUID productId, ProductVariant variant) {
        UUID orgId = TenantContext.requireTenantId();
        Product product = getById(productId);

        if (variantRepository.existsBySkuAndOrganizationId(variant.getSku(), orgId)) {
            throw new BusinessException("CONFLICT", "Variant with SKU " + variant.getSku() + " already exists");
        }

        Organization organization = new Organization();
        organization.setId(orgId);
        variant.setProduct(product);
        variant.setOrganization(organization);
        variant = variantRepository.save(variant);

        Inventory inventory = Inventory.builder()
                .variant(variant)
                .organization(organization)
                .currentQuantity(0)
                .reservedQuantity(0)
                .availableQuantity(0)
                .incomingQuantity(0)
                .damagedQuantity(0)
                .returnedQuantity(0)
                .averageCost(BigDecimal.ZERO)
                .totalValue(BigDecimal.ZERO)
                .build();
        inventoryRepository.save(inventory);

        log.info("Created variant: {} ({}) for product {}", variant.getSku(), variant.getColor() + "/" + variant.getSize(), product.getName());
        return variant;
    }

    @Transactional
    public ProductVariant updateVariant(UUID id, ProductVariant variant) {
        UUID orgId = TenantContext.requireTenantId();
        ProductVariant existing = getVariantById(id);

        if (!existing.getSku().equals(variant.getSku()) &&
                variantRepository.existsBySkuAndOrganizationIdAndIdNot(variant.getSku(), orgId, id)) {
            throw new BusinessException("CONFLICT", "Variant with SKU " + variant.getSku() + " already exists");
        }

        existing.setSize(variant.getSize());
        existing.setColor(variant.getColor());
        existing.setPurchasePrice(variant.getPurchasePrice());
        existing.setSellingPrice(variant.getSellingPrice());
        existing.setMinStockLevel(variant.getMinStockLevel());
        existing.setReorderQuantity(variant.getReorderQuantity());
        existing.setBarcode(variant.getBarcode());
        existing.setStatus(variant.getStatus());
        existing.setImageUrl(variant.getImageUrl());

        return variantRepository.save(existing);
    }

    @Transactional
    public void deleteVariant(UUID id) {
        UUID orgId = TenantContext.requireTenantId();
        ProductVariant variant = getVariantById(id);
        variantRepository.delete(variant);
        log.info("Deleted variant: {} ({})", variant.getSku(), variant.getColor() + "/" + variant.getSize());
    }
}

