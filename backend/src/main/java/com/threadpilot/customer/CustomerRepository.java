package com.threadpilot.customer;

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
public interface CustomerRepository extends JpaRepository<Customer, UUID> {

    Optional<Customer> findByGstNumberAndOrganizationId(String gstNumber, UUID organizationId);

    Optional<Customer> findByGstNumber(String gstNumber);

    @Query("SELECT c FROM Customer c WHERE c.organization.id = :orgId AND c.status = 'ACTIVE'")
    Page<Customer> findActiveByOrganizationId(@Param("orgId") UUID organizationId, Pageable pageable);

    @Query("SELECT c FROM Customer c WHERE c.organization.id = :orgId AND (LOWER(c.name) LIKE LOWER(CONCAT('%', :term, '%')) OR LOWER(c.businessName) LIKE LOWER(CONCAT('%', :term, '%')) OR LOWER(c.gstNumber) LIKE LOWER(CONCAT('%', :term, '%')))")
    Page<Customer> search(@Param("orgId") UUID organizationId, @Param("term") String term, Pageable pageable);

    @Query("SELECT c FROM Customer c WHERE c.organization.id = :orgId AND c.outstandingAmount > 0 ORDER BY c.outstandingAmount DESC")
    List<Customer> findWithOutstanding(@Param("orgId") UUID organizationId);

    @Query("SELECT c FROM Customer c WHERE c.organization.id = :orgId AND c.outstandingAmount > 0 AND c.status = 'ACTIVE'")
    List<Customer> findWithOutstandingActive(@Param("orgId") UUID organizationId);

    @Query("SELECT c FROM Customer c WHERE c.organization.id = :orgId AND c.outstandingAmount > :threshold")
    List<Customer> findWithOutstandingAboveThreshold(@Param("orgId") UUID organizationId, @Param("threshold") java.math.BigDecimal threshold);

    @Query("SELECT c FROM Customer c WHERE c.organization.id = :orgId AND c.creditLimit > 0 AND c.outstandingAmount > c.creditLimit")
    List<Customer> findExceedingCreditLimit(@Param("orgId") UUID organizationId);

    boolean existsByGstNumberAndOrganizationId(String gstNumber, UUID organizationId);

    boolean existsByGstNumberAndOrganizationIdAndIdNot(String gstNumber, UUID organizationId, UUID id);

    @Query("SELECT SUM(c.outstandingAmount) FROM Customer c WHERE c.organization.id = :orgId")
    java.math.BigDecimal getTotalOutstanding(@Param("orgId") UUID organizationId);

    @Query("SELECT COUNT(c) FROM Customer c WHERE c.organization.id = :orgId AND c.status = 'ACTIVE'")
    long countActiveByOrganizationId(@Param("orgId") UUID organizationId);
}
