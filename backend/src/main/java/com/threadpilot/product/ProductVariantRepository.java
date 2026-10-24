package com.threadpilot.product;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProductVariantRepository extends JpaRepository<ProductVariant, UUID> {

    Optional<ProductVariant> findBySkuAndOrganizationId(String sku, UUID organizationId);

@Query("SELECT v FROM ProductVariant v WHERE v.product.id = :productId AND v.status = 'ACTIVE'")
    Page<ProductVariant> findActiveByProductId(@Param("productId") UUID productId, Pageable pageable);

    @Query("SELECT v FROM ProductVariant v WHERE v.organization.id = :orgId AND v.status = 'ACTIVE'")
    Page<ProductVariant> findActiveByOrganizationId(@Param("orgId") UUID organizationId, Pageable pageable);

    @Query("SELECT v FROM ProductVariant v WHERE v.organization.id = :orgId AND (LOWER(v.sku) LIKE LOWER(CONCAT('%', :term, '%')) OR LOWER(v.size) LIKE LOWER(CONCAT('%', :term, '%')) OR LOWER(v.color) LIKE LOWER(CONCAT('%', :term, '%')))")
    Page<ProductVariant> search(@Param("orgId") UUID organizationId, @Param("term") String term, Pageable pageable);

    @Query("SELECT v FROM ProductVariant v WHERE v.organization.id = :orgId AND v.barcode = :barcode")
    Optional<ProductVariant> findByBarcode(@Param("orgId") UUID organizationId, @Param("barcode") String barcode);

    boolean existsBySkuAndOrganizationId(String sku, UUID organizationId);

    boolean existsBySkuAndOrganizationIdAndIdNot(String sku, UUID organizationId, UUID id);
}

