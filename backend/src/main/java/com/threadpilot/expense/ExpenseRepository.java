package com.threadpilot.expense;

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
public interface ExpenseRepository extends JpaRepository<Expense, UUID> {

    @Query("SELECT e FROM Expense e WHERE e.organization.id = :orgId ORDER BY e.expenseDate DESC")
    Page<Expense> findByOrganizationId(@Param("orgId") UUID organizationId, Pageable pageable);

    @Query("SELECT e FROM Expense e WHERE e.organization.id = :orgId AND e.category = :category ORDER BY e.expenseDate DESC")
    Page<Expense> findByCategory(@Param("orgId") UUID organizationId, @Param("category") ExpenseCategory category, Pageable pageable);

    @Query("SELECT e FROM Expense e WHERE e.organization.id = :orgId AND e.expenseDate BETWEEN :start AND :end ORDER BY e.expenseDate DESC")
    List<Expense> findByDateRange(@Param("orgId") UUID organizationId, @Param("start") LocalDate start, @Param("end") LocalDate end);

    @Query("SELECT SUM(e.amount) FROM Expense e WHERE e.organization.id = :orgId AND e.expenseDate BETWEEN :start AND :end")
    java.math.BigDecimal getTotalByDateRange(@Param("orgId") UUID organizationId, @Param("start") LocalDate start, @Param("end") LocalDate end);

    @Query("SELECT SUM(e.amount) FROM Expense e WHERE e.organization.id = :orgId AND e.category = :category AND e.expenseDate BETWEEN :start AND :end")
    java.math.BigDecimal getTotalByCategoryAndDateRange(@Param("orgId") UUID organizationId, @Param("category") ExpenseCategory category, @Param("start") LocalDate start, @Param("end") LocalDate end);

    @Query("SELECT NEW com.threadpilot.analytics.dto.ExpenseSummary(e.category, SUM(e.amount), COUNT(e)) " +
            "FROM Expense e WHERE e.organization.id = :orgId AND e.expenseDate BETWEEN :start AND :end GROUP BY e.category ORDER BY SUM(e.amount) DESC")
    List<com.threadpilot.analytics.dto.ExpenseSummary> getExpensesByCategory(@Param("orgId") UUID organizationId, @Param("start") LocalDate start, @Param("end") LocalDate end);
}

