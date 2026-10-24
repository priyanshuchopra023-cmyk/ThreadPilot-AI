package com.threadpilot.sale;

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
public interface SaleRepository extends JpaRepository<Sale, UUID> {

    Optional<Sale> findBySaleNumberAndOrganizationId(String saleNumber, UUID organizationId);

    @Query("SELECT s FROM Sale s WHERE s.organization.id = :orgId ORDER BY s.saleDate DESC")
    Page<Sale> findByOrganizationId(@Param("orgId") UUID organizationId, Pageable pageable);

    @Query("SELECT s FROM Sale s WHERE s.customer.id = :customerId AND s.organization.id = :orgId ORDER BY s.saleDate DESC")
    Page<Sale> findByCustomerId(@Param("customerId") UUID customerId, @Param("orgId") UUID organizationId, Pageable pageable);

    @Query("SELECT s FROM Sale s WHERE s.organization.id = :orgId AND s.saleDate BETWEEN :start AND :end ORDER BY s.saleDate DESC")
    List<Sale> findByDateRange(@Param("orgId") UUID organizationId, @Param("start") LocalDate start, @Param("end") LocalDate end);

    @Query("SELECT SUM(s.totalAmount) FROM Sale s WHERE s.organization.id = :orgId AND s.saleDate BETWEEN :start AND :end")
    java.math.BigDecimal getTotalRevenueByDateRange(@Param("orgId") UUID organizationId, @Param("start") LocalDate start, @Param("end") LocalDate end);

    @Query("SELECT SUM(s.grossProfit) FROM Sale s WHERE s.organization.id = :orgId AND s.saleDate BETWEEN :start AND :end")
    java.math.BigDecimal getTotalGrossProfitByDateRange(@Param("orgId") UUID organizationId, @Param("start") LocalDate start, @Param("end") LocalDate end);

@Query("SELECT NEW com.threadpilot.analytics.dto.ProductSalesSummary(si.product.id, si.product.name, si.product.sku, SUM(si.quantity), SUM(si.lineTotal), SUM(si.costAmount), SUM(si.lineTotal) - SUM(si.costAmount)) " +
            "FROM Sale s JOIN s.items si WHERE s.organization.id = :orgId AND s.saleDate BETWEEN :start AND :end GROUP BY si.product.id, si.product.name, si.product.sku ORDER BY SUM(si.lineTotal) DESC")
    List<com.threadpilot.analytics.dto.ProductSalesSummary> getTopSellingProducts(@Param("orgId") UUID organizationId, @Param("start") LocalDate start, @Param("end") LocalDate end, Pageable pageable);

    @Query("SELECT NEW com.threadpilot.analytics.dto.CustomerSalesSummary(s.customer.id, s.customer.name, SUM(s.totalAmount), COUNT(s)) " +
            "FROM Sale s WHERE s.organization.id = :orgId AND s.saleDate BETWEEN :start AND :end AND s.customer IS NOT NULL GROUP BY s.customer.id, s.customer.name ORDER BY SUM(s.totalAmount) DESC")
    List<com.threadpilot.analytics.dto.CustomerSalesSummary> getTopCustomers(@Param("orgId") UUID organizationId, @Param("start") LocalDate start, @Param("end") LocalDate end, Pageable pageable);

boolean existsBySaleNumberAndOrganizationId(String saleNumber, UUID organizationId);

    boolean existsByOrderId(UUID orderId);

    @Query("SELECT s FROM Sale s WHERE s.organization.id = :orgId AND s.saleDate BETWEEN :start AND :end ORDER BY s.saleDate DESC")
    List<Sale> findByOrganizationIdAndSaleDateBetween(@Param("orgId") UUID organizationId, @Param("start") LocalDate start, @Param("end") LocalDate end);

    @Query("SELECT COUNT(s) FROM Sale s WHERE s.organization.id = :orgId AND s.saleDate BETWEEN :start AND :end")
    long countByDateRange(@Param("orgId") UUID organizationId, @Param("start") LocalDate start, @Param("end") LocalDate end);

    @Query("SELECT COUNT(s) FROM Sale s WHERE s.organization.id = :orgId")
    long countAllByOrganizationId(@Param("orgId") UUID organizationId);

    @Query("SELECT SUM(s.totalAmount) FROM Sale s WHERE s.organization.id = :orgId")
    java.math.BigDecimal getTotalRevenueAllTime(@Param("orgId") UUID organizationId);

    @Query("SELECT NEW com.threadpilot.analytics.dto.ProductSalesSummary(p.category, p.category, '', SUM(si.quantity), SUM(si.lineTotal), SUM(si.costAmount), SUM(si.lineTotal) - SUM(si.costAmount)) " +
            "FROM Sale s JOIN s.items si JOIN si.product p WHERE s.organization.id = :orgId AND s.saleDate BETWEEN :start AND :end AND p.category IS NOT NULL GROUP BY p.category ORDER BY SUM(si.lineTotal) DESC")
    List<com.threadpilot.analytics.dto.ProductSalesSummary> getSalesByCategory(@Param("orgId") UUID organizationId, @Param("start") LocalDate start, @Param("end") LocalDate end);
}

