package com.threadpilot.supplier;

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
public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrder, UUID> {

    Optional<PurchaseOrder> findByOrderNumberAndOrganizationId(String orderNumber, UUID organizationId);

    @Query("SELECT po FROM PurchaseOrder po WHERE po.organization.id = :orgId ORDER BY po.orderDate DESC")
    Page<PurchaseOrder> findByOrganizationId(@Param("orgId") UUID organizationId, Pageable pageable);

    @Query("SELECT po FROM PurchaseOrder po WHERE po.supplier.id = :supplierId AND po.organization.id = :orgId ORDER BY po.orderDate DESC")
    Page<PurchaseOrder> findBySupplierId(@Param("supplierId") UUID supplierId, @Param("orgId") UUID organizationId, Pageable pageable);

    @Query("SELECT po FROM PurchaseOrder po WHERE po.organization.id = :orgId AND po.status IN ('SENT', 'CONFIRMED', 'PARTIALLY_RECEIVED') ORDER BY po.expectedDeliveryDate ASC")
    List<PurchaseOrder> findPendingReceipt(@Param("orgId") UUID organizationId);

    boolean existsByOrderNumberAndOrganizationId(String orderNumber, UUID organizationId);
}

