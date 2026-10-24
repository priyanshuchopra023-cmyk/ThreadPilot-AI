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
public interface SupplierRepository extends JpaRepository<Supplier, UUID> {

    Optional<Supplier> findByGstNumber(String gstNumber);

    @Query("SELECT s FROM Supplier s WHERE s.organization.id = :orgId AND s.status = 'ACTIVE'")
    Page<Supplier> findActiveByOrganizationId(@Param("orgId") UUID organizationId, Pageable pageable);

    @Query("SELECT s FROM Supplier s WHERE s.organization.id = :orgId AND (LOWER(s.name) LIKE LOWER(CONCAT('%', :term, '%')) OR LOWER(s.companyName) LIKE LOWER(CONCAT('%', :term, '%')) OR LOWER(s.gstNumber) LIKE LOWER(CONCAT('%', :term, '%')))")
    Page<Supplier> search(@Param("orgId") UUID organizationId, @Param("term") String term, Pageable pageable);

    @Query("SELECT s FROM Supplier s WHERE s.organization.id = :orgId AND s.outstandingAmount > 0 ORDER BY s.outstandingAmount DESC")
    List<Supplier> findWithOutstanding(@Param("orgId") UUID organizationId);

    @Query("SELECT s FROM Supplier s WHERE s.organization.id = :orgId AND s.outstandingAmount > 0 AND s.status = 'ACTIVE'")
    List<Supplier> findWithOutstandingActive(@Param("orgId") UUID organizationId);

    boolean existsByGstNumberAndOrganizationId(String gstNumber, UUID organizationId);

    boolean existsByGstNumberAndOrganizationIdAndIdNot(String gstNumber, UUID organizationId, UUID id);

    @Query("SELECT SUM(s.outstandingAmount) FROM Supplier s WHERE s.organization.id = :orgId")
    java.math.BigDecimal getTotalOutstanding(@Param("orgId") UUID organizationId);
}

