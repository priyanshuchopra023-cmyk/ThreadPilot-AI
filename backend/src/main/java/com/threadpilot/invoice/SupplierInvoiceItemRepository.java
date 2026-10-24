package com.threadpilot.invoice;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SupplierInvoiceItemRepository extends JpaRepository<SupplierInvoiceItem, UUID> {

    @Query("SELECT i FROM SupplierInvoiceItem i WHERE i.invoice.id = :invoiceId")
    List<SupplierInvoiceItem> findByInvoiceId(@Param("invoiceId") UUID invoiceId);
}

