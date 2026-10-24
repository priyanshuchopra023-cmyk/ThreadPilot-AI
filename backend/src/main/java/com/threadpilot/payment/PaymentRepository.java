package com.threadpilot.payment;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, UUID> {

    @Query("SELECT p FROM Payment p WHERE p.organization.id = :orgId ORDER BY p.paymentDate DESC")
    Page<Payment> findByOrganizationId(@Param("orgId") UUID organizationId, Pageable pageable);

@Query("SELECT p FROM Payment p WHERE p.customer.id = :customerId AND p.organization.id = :orgId ORDER BY p.paymentDate DESC")
    Page<Payment> findByCustomerId(@Param("customerId") UUID customerId, @Param("orgId") UUID organizationId, Pageable pageable);

    @Query("SELECT p FROM Payment p WHERE p.customer.id = :customerId AND p.organization.id = :orgId ORDER BY p.paymentDate DESC")
    List<Payment> findByCustomerId(@Param("customerId") UUID customerId, @Param("orgId") UUID organizationId);

    @Query("SELECT p FROM Payment p WHERE p.supplier.id = :supplierId AND p.organization.id = :orgId ORDER BY p.paymentDate DESC")
    Page<Payment> findBySupplierId(@Param("supplierId") UUID supplierId, @Param("orgId") UUID organizationId, Pageable pageable);

    @Query("SELECT p FROM Payment p WHERE p.supplier.id = :supplierId AND p.organization.id = :orgId ORDER BY p.paymentDate DESC")
    List<Payment> findBySupplierId(@Param("supplierId") UUID supplierId, @Param("orgId") UUID organizationId);

    @Query("SELECT p FROM Payment p WHERE p.supplierInvoice.id = :invoiceId AND p.organization.id = :orgId ORDER BY p.paymentDate DESC")
    List<Payment> findBySupplierInvoiceId(@Param("invoiceId") UUID invoiceId, @Param("orgId") UUID organizationId);

    @Query("SELECT p FROM Payment p WHERE p.customerOrder.id = :orderId AND p.organization.id = :orgId ORDER BY p.paymentDate DESC")
    List<Payment> findByCustomerOrderId(@Param("orderId") UUID orderId, @Param("orgId") UUID organizationId);

    @Query("SELECT p FROM Payment p WHERE p.organization.id = :orgId AND p.paymentDate BETWEEN :start AND :end ORDER BY p.paymentDate DESC")
    List<Payment> findByDateRange(@Param("orgId") UUID organizationId, @Param("start") LocalDate start, @Param("end") LocalDate end);

    @Query("SELECT SUM(p.amount) FROM Payment p WHERE p.organization.id = :orgId AND p.paymentType = 'CUSTOMER_PAYMENT' AND p.paymentDate BETWEEN :start AND :end")
    java.math.BigDecimal getTotalCustomerPayments(@Param("orgId") UUID organizationId, @Param("start") LocalDate start, @Param("end") LocalDate end);

    @Query("SELECT SUM(p.amount) FROM Payment p WHERE p.organization.id = :orgId AND p.paymentType = 'SUPPLIER_PAYMENT' AND p.paymentDate BETWEEN :start AND :end")
    java.math.BigDecimal getTotalSupplierPayments(@Param("orgId") UUID organizationId, @Param("start") LocalDate start, @Param("end") LocalDate end);

@Query("SELECT SUM(p.amount) FROM Payment p WHERE p.organization.id = :orgId AND p.paymentType = :type AND p.paymentDate BETWEEN :start AND :end")
    java.math.BigDecimal getTotalPaymentsByTypeAndDateRange(@Param("orgId") UUID organizationId, @Param("type") String type, @Param("start") LocalDate start, @Param("end") LocalDate end);

    @Query("SELECT p FROM Payment p WHERE p.organization.id = :orgId AND p.paymentType = 'CUSTOMER_PAYMENT' AND p.paymentDate BETWEEN :start AND :end ORDER BY p.paymentDate DESC")
    List<Payment> findCustomerPaymentsByOrganizationIdAndDateRange(@Param("orgId") UUID organizationId, @Param("start") LocalDate start, @Param("end") LocalDate end);
}

