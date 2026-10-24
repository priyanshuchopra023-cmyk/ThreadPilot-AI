package com.threadpilot.invoice;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import jakarta.persistence.LockModeType;

@Repository
public interface SupplierInvoiceRepository extends JpaRepository<SupplierInvoice, UUID> {

    Optional<SupplierInvoice> findByInvoiceNumberAndOrganizationId(String invoiceNumber, UUID organizationId);

    @Query("SELECT i FROM SupplierInvoice i WHERE i.organization.id = :orgId ORDER BY i.invoiceDate DESC")
    Page<SupplierInvoice> findByOrganizationId(@Param("orgId") UUID organizationId, Pageable pageable);

    @Query("SELECT i FROM SupplierInvoice i WHERE i.supplier.id = :supplierId AND i.organization.id = :orgId ORDER BY i.invoiceDate DESC")
    Page<SupplierInvoice> findBySupplierId(@Param("supplierId") UUID supplierId, @Param("orgId") UUID organizationId, Pageable pageable);

    @Query("SELECT i FROM SupplierInvoice i WHERE i.organization.id = :orgId AND i.status IN ('VERIFIED', 'PARTIALLY_PAID', 'OVERDUE') AND i.dueDate < :today ORDER BY i.dueDate ASC")
    List<SupplierInvoice> findOverdue(@Param("orgId") UUID organizationId, @Param("today") LocalDate today);

    @Query("SELECT i FROM SupplierInvoice i WHERE i.organization.id = :orgId AND i.status = 'VERIFIED' AND i.dueDate BETWEEN :today AND :futureDate ORDER BY i.dueDate ASC")
    List<SupplierInvoice> findDueSoon(@Param("orgId") UUID organizationId, @Param("today") LocalDate today, @Param("futureDate") LocalDate futureDate);

    @Query("SELECT SUM(i.outstandingAmount) FROM SupplierInvoice i WHERE i.organization.id = :orgId")
    java.math.BigDecimal getTotalOutstanding(@Param("orgId") UUID organizationId);

    @Query("SELECT COUNT(i) FROM SupplierInvoice i WHERE i.organization.id = :orgId AND i.status IN ('VERIFIED', 'PARTIALLY_PAID', 'OVERDUE') AND i.dueDate < :today")
    long countOverdue(@Param("orgId") UUID organizationId, @Param("today") LocalDate today);

    boolean existsByInvoiceNumberAndOrganizationId(String invoiceNumber, UUID organizationId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT i FROM SupplierInvoice i WHERE i.id = :id")
    Optional<SupplierInvoice> findByIdWithLock(@Param("id") UUID id);

    Optional<SupplierInvoice> findByDocumentUrlAndOrganizationId(String documentUrl, UUID organizationId);

    @Query("SELECT i FROM SupplierInvoice i WHERE i.organization.id = :orgId " +
           "AND (:status IS NULL OR i.status = :status) " +
           "AND (:ocrStatus IS NULL OR i.ocrStatus = :ocrStatus) " +
           "AND (:supplierId IS NULL OR i.supplier.id = :supplierId) " +
           "ORDER BY i.invoiceDate DESC")
    Page<SupplierInvoice> findWithFilters(
            @Param("orgId") UUID organizationId,
            @Param("status") String status,
            @Param("ocrStatus") String ocrStatus,
            @Param("supplierId") UUID supplierId,
            Pageable pageable);
}

