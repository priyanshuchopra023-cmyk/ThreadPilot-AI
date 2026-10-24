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
public interface ProductRepository extends JpaRepository<Product, UUID> {

    Optional<Product> findBySkuAndOrganizationId(String sku, UUID organizationId);

    @Query("SELECT p FROM Product p WHERE p.organization.id = :orgId AND p.status = 'ACTIVE'")
    Page<Product> findActiveByOrganizationId(@Param("orgId") UUID organizationId, Pageable pageable);

    @Query("SELECT p FROM Product p WHERE p.organization.id = :orgId AND (LOWER(p.name) LIKE LOWER(CONCAT('%', :term, '%')) OR LOWER(p.sku) LIKE LOWER(CONCAT('%', :term, '%')) OR LOWER(p.brand) LIKE LOWER(CONCAT('%', :term, '%')) OR LOWER(p.category) LIKE LOWER(CONCAT('%', :term, '%')))")
    Page<Product> search(@Param("orgId") UUID organizationId, @Param("term") String term, Pageable pageable);

    @Query("SELECT p FROM Product p WHERE p.organization.id = :orgId AND p.category = :category AND p.status = 'ACTIVE'")
    List<Product> findByCategory(@Param("orgId") UUID organizationId, @Param("category") String category);

    @Query("SELECT p FROM Product p WHERE p.organization.id = :orgId AND p.brand = :brand AND p.status = 'ACTIVE'")
    List<Product> findByBrand(@Param("orgId") UUID organizationId, @Param("brand") String brand);

    @Query("SELECT p FROM Product p WHERE p.organization.id = :orgId AND p.supplier.id = :supplierId")
    List<Product> findBySupplier(@Param("orgId") UUID organizationId, @Param("supplierId") UUID supplierId);

    @Query("SELECT p FROM Product p WHERE p.organization.id = :orgId AND p.barcode = :barcode")
    Optional<Product> findByBarcode(@Param("orgId") UUID organizationId, @Param("barcode") String barcode);

    boolean existsBySkuAndOrganizationId(String sku, UUID organizationId);

    boolean existsBySkuAndOrganizationIdAndIdNot(String sku, UUID organizationId, UUID id);

@Query("SELECT COUNT(p) FROM Product p WHERE p.organization.id = :orgId AND p.status = 'ACTIVE'")
    long countActiveByOrganizationId(@Param("orgId") UUID organizationId);

    @Query("SELECT COUNT(p) FROM Product p WHERE p.organization.id = :orgId AND p.status = 'ACTIVE' AND p.id NOT IN (SELECT DISTINCT si.product.id FROM SaleItem si JOIN si.sale s WHERE s.organization.id = :orgId AND s.saleDate >= :sinceDate)")
    long countSlowMoving(@Param("orgId") UUID organizationId, @Param("sinceDate") java.time.LocalDate sinceDate);

    @Query("SELECT p FROM Product p WHERE p.organization.id = :orgId AND p.status = 'ACTIVE' AND p.id NOT IN (SELECT DISTINCT si.product.id FROM SaleItem si JOIN si.sale s WHERE s.organization.id = :orgId AND s.saleDate >= :sinceDate)")
    List<Product> findSlowMoving(@Param("orgId") UUID organizationId, @Param("sinceDate") java.time.LocalDate sinceDate, Pageable pageable);
}

