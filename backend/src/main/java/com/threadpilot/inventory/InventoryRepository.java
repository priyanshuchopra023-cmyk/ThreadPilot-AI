package com.threadpilot.inventory;

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
public interface InventoryRepository extends JpaRepository<Inventory, UUID> {

    Optional<Inventory> findByProductIdAndOrganizationId(UUID productId, UUID organizationId);

    Optional<Inventory> findByVariantIdAndOrganizationId(UUID variantId, UUID organizationId);

    @Query("SELECT i FROM Inventory i WHERE i.organization.id = :orgId")
    Page<Inventory> findByOrganizationId(@Param("orgId") UUID organizationId, Pageable pageable);

    @Query("SELECT i FROM Inventory i WHERE i.organization.id = :orgId AND i.availableQuantity <= :threshold")
    List<Inventory> findLowStock(@Param("orgId") UUID organizationId, @Param("threshold") int threshold);

@Query("SELECT i FROM Inventory i WHERE i.organization.id = :orgId AND i.currentQuantity = 0")
    List<Inventory> findOutOfStock(@Param("orgId") UUID organizationId);

    @Query("SELECT i FROM Inventory i WHERE i.organization.id = :orgId AND i.currentQuantity > 0")
    List<Inventory> findWithStock(@Param("orgId") UUID organizationId);

    @Query("SELECT SUM(i.totalValue) FROM Inventory i WHERE i.organization.id = :orgId")
    java.math.BigDecimal getTotalInventoryValue(@Param("orgId") UUID organizationId);

    @Query("SELECT COUNT(i) FROM Inventory i WHERE i.organization.id = :orgId AND i.availableQuantity <= :threshold")
    long countLowStock(@Param("orgId") UUID organizationId, @Param("threshold") int threshold);
}

