package com.threadpilot.inventory;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface StockMovementRepository extends JpaRepository<StockMovement, UUID> {

    @Query("SELECT m FROM StockMovement m WHERE m.organization.id = :orgId ORDER BY m.createdAt DESC")
    Page<StockMovement> findByOrganizationId(@Param("orgId") UUID organizationId, Pageable pageable);

    @Query("SELECT m FROM StockMovement m WHERE m.product.id = :productId AND m.organization.id = :orgId ORDER BY m.createdAt DESC")
    Page<StockMovement> findByProductId(@Param("productId") UUID productId, @Param("orgId") UUID organizationId, Pageable pageable);

    @Query("SELECT m FROM StockMovement m WHERE m.variant.id = :variantId AND m.organization.id = :orgId ORDER BY m.createdAt DESC")
    Page<StockMovement> findByVariantId(@Param("variantId") UUID variantId, @Param("orgId") UUID organizationId, Pageable pageable);

    @Query("SELECT m FROM StockMovement m WHERE m.referenceType = :refType AND m.referenceId = :refId AND m.organization.id = :orgId ORDER BY m.createdAt DESC")
    List<StockMovement> findByReference(@Param("refType") String referenceType, @Param("refId") UUID referenceId, @Param("orgId") UUID organizationId);

    @Query("SELECT m FROM StockMovement m WHERE m.organization.id = :orgId AND m.movementType = :type AND m.createdAt BETWEEN :start AND :end ORDER BY m.createdAt DESC")
    List<StockMovement> findByTypeAndDateRange(@Param("orgId") UUID organizationId, @Param("type") MovementType type, @Param("start") Instant start, @Param("end") Instant end);

    @Query("SELECT SUM(m.quantity) FROM StockMovement m WHERE m.organization.id = :orgId AND m.movementType = :type AND m.createdAt BETWEEN :start AND :end")
    Long getTotalQuantityByTypeAndDateRange(@Param("orgId") UUID organizationId, @Param("type") MovementType type, @Param("start") Instant start, @Param("end") Instant end);
}

