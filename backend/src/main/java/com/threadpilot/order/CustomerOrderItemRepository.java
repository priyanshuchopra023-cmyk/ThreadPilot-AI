package com.threadpilot.order;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CustomerOrderItemRepository extends JpaRepository<CustomerOrderItem, UUID> {

    @Query("SELECT i FROM CustomerOrderItem i WHERE i.order.id = :orderId")
    List<CustomerOrderItem> findByOrderId(@Param("orderId") UUID orderId);

    @Query("SELECT i FROM CustomerOrderItem i WHERE i.product.id = :productId AND i.order.organization.id = :orgId AND i.order.status IN ('CONFIRMED', 'PROCESSING', 'READY')")
    List<CustomerOrderItem> findPendingByProductId(@Param("productId") UUID productId, @Param("orgId") UUID organizationId);

    @Query("SELECT i FROM CustomerOrderItem i WHERE i.variant.id = :variantId AND i.order.organization.id = :orgId AND i.order.status IN ('CONFIRMED', 'PROCESSING', 'READY')")
    List<CustomerOrderItem> findPendingByVariantId(@Param("variantId") UUID variantId, @Param("orgId") UUID organizationId);
}

