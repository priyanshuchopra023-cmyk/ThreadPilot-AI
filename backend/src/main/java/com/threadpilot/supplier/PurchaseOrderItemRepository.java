package com.threadpilot.supplier;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PurchaseOrderItemRepository extends JpaRepository<PurchaseOrderItem, UUID> {

    @Query("SELECT i FROM PurchaseOrderItem i WHERE i.purchaseOrder.id = :orderId")
    List<PurchaseOrderItem> findByPurchaseOrderId(@Param("orderId") UUID orderId);

    @Query("SELECT i FROM PurchaseOrderItem i WHERE i.product.id = :productId AND i.purchaseOrder.organization.id = :orgId AND i.purchaseOrder.status IN ('SENT', 'CONFIRMED', 'PARTIALLY_RECEIVED')")
    List<PurchaseOrderItem> findPendingByProductId(@Param("productId") UUID productId, @Param("orgId") UUID organizationId);
}

