package com.threadpilot.order;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CustomerOrderRepository extends JpaRepository<CustomerOrder, UUID> {

    Optional<CustomerOrder> findByOrderNumberAndOrganizationId(String orderNumber, UUID organizationId);

    @Query("SELECT o FROM CustomerOrder o WHERE o.organization.id = :orgId ORDER BY o.orderDate DESC")
    Page<CustomerOrder> findByOrganizationId(@Param("orgId") UUID organizationId, Pageable pageable);

    @Query("SELECT o FROM CustomerOrder o WHERE o.customer.id = :customerId AND o.organization.id = :orgId ORDER BY o.orderDate DESC")
    Page<CustomerOrder> findByCustomerId(@Param("customerId") UUID customerId, @Param("orgId") UUID organizationId, Pageable pageable);

    @Query("SELECT o FROM CustomerOrder o WHERE o.organization.id = :orgId AND o.status IN ('CONFIRMED', 'PROCESSING', 'READY') ORDER BY o.expectedDeliveryDate ASC")
    List<CustomerOrder> findPendingFulfillment(@Param("orgId") UUID organizationId);

    @Query("SELECT o FROM CustomerOrder o WHERE o.organization.id = :orgId AND o.paymentStatus IN ('PENDING', 'PARTIALLY_PAID', 'OVERDUE') AND o.outstandingAmount > 0 ORDER BY o.orderDate ASC")
    List<CustomerOrder> findWithOutstanding(@Param("orgId") UUID organizationId);

    @Query("SELECT SUM(o.outstandingAmount) FROM CustomerOrder o WHERE o.organization.id = :orgId AND o.paymentStatus IN ('PENDING', 'PARTIALLY_PAID', 'OVERDUE')")
    java.math.BigDecimal getTotalOutstanding(@Param("orgId") UUID organizationId);

boolean existsByOrderNumberAndOrganizationId(String orderNumber, UUID organizationId);

    @Query("SELECT o FROM CustomerOrder o WHERE o.organization.id = :orgId AND o.orderDate BETWEEN :start AND :end ORDER BY o.orderDate DESC")
    List<CustomerOrder> findByDateRange(@Param("orgId") UUID organizationId, @Param("start") LocalDate start, @Param("end") LocalDate end);
}

