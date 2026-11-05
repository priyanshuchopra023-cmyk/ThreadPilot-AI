package com.threadpilot.expense;

import com.threadpilot.common.dto.PageResponse;
import com.threadpilot.common.dto.PaginationRequest;
import com.threadpilot.common.exception.BusinessException;
import com.threadpilot.common.exception.ResourceNotFoundException;
import com.threadpilot.organization.Organization;
import com.threadpilot.security.TenantContext;
import com.threadpilot.user.User;
import com.threadpilot.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public PageResponse<Expense> getAll(PaginationRequest request) {
        UUID orgId = TenantContext.requireTenantId();

        ExpenseCategory category = null;
        if (request.getCategory() != null && !request.getCategory().isBlank()) {
            try {
                category = ExpenseCategory.valueOf(request.getCategory().trim().toUpperCase());
            } catch (IllegalArgumentException ignored) {}
        }

        LocalDate startDate = null;
        if (request.getStartDate() != null && !request.getStartDate().isBlank()) {
            try {
                startDate = LocalDate.parse(request.getStartDate().trim().split("T")[0]);
            } catch (Exception ignored) {}
        }

        LocalDate endDate = null;
        if (request.getEndDate() != null && !request.getEndDate().isBlank()) {
            try {
                endDate = LocalDate.parse(request.getEndDate().trim().split("T")[0]);
            } catch (Exception ignored) {}
        }

        Page<Expense> page = expenseRepository.findWithFilters(orgId, category, startDate, endDate, request.toPageable());
        return PageResponse.of(page);
    }

    @Transactional(readOnly = true)
    public PageResponse<Expense> getByCategory(ExpenseCategory category, PaginationRequest request) {
        UUID orgId = TenantContext.requireTenantId();
        Page<Expense> page = expenseRepository.findByCategory(orgId, category, request.toPageable());
        return PageResponse.of(page);
    }

    @Transactional(readOnly = true)
    public Expense getById(UUID id) {
        UUID orgId = TenantContext.requireTenantId();
        return expenseRepository.findById(id)
                .filter(e -> e.getOrganization().getId().equals(orgId))
                .orElseThrow(() -> new ResourceNotFoundException("Expense", id));
    }

    @Transactional(readOnly = true)
    public List<Expense> getByDateRange(LocalDate start, LocalDate end) {
        UUID orgId = TenantContext.requireTenantId();
        return expenseRepository.findByDateRange(orgId, start, end);
    }

    @Transactional(readOnly = true)
    public BigDecimal getTotalByDateRange(LocalDate start, LocalDate end) {
        UUID orgId = TenantContext.requireTenantId();
        return expenseRepository.getTotalByDateRange(orgId, start, end);
    }

    @Transactional(readOnly = true)
    public BigDecimal getTotalByCategoryAndDateRange(ExpenseCategory category, LocalDate start, LocalDate end) {
        UUID orgId = TenantContext.requireTenantId();
        return expenseRepository.getTotalByCategoryAndDateRange(orgId, category, start, end);
    }

    @Transactional(readOnly = true)
    public List<com.threadpilot.analytics.dto.ExpenseSummary> getExpensesByCategory(LocalDate start, LocalDate end) {
        UUID orgId = TenantContext.requireTenantId();
        return expenseRepository.getExpensesByCategory(orgId, start, end);
    }

    @Transactional(readOnly = true)
    public List<com.threadpilot.analytics.dto.ExpenseSummary> getExpensesSummary(LocalDate start, LocalDate end) {
        UUID orgId = TenantContext.requireTenantId();
        if (start != null && end != null) {
            return expenseRepository.getExpensesByCategory(orgId, start, end);
        }
        return expenseRepository.getExpensesByCategoryAllTime(orgId);
    }

    @Transactional
    public Expense create(Expense expense) {
        UUID orgId = TenantContext.requireTenantId();
        UUID userId = TenantContext.getUserId();

        if (expense.getExpenseNumber() == null || expense.getExpenseNumber().trim().isEmpty()) {
            expense.setExpenseNumber("EXP-" + System.currentTimeMillis() + "-" + UUID.randomUUID().toString().substring(0, 4).toUpperCase());
        }

        Organization organization = new Organization();
        organization.setId(orgId);

        expense.setOrganization(organization);
        expense.setRecordedBy(userId != null ? userRepository.findById(userId).orElse(null) : null);
        expense = expenseRepository.save(expense);

        log.info("Created expense: {} - {}", expense.getExpenseNumber(), expense.getCategory());
        return expense;
    }

    @Transactional
    public Expense update(UUID id, Expense expense) {
        UUID orgId = TenantContext.requireTenantId();
        Expense existing = getById(id);

        existing.setCategory(expense.getCategory());
        existing.setExpenseDate(expense.getExpenseDate());
        existing.setAmount(expense.getAmount());
        existing.setPaymentMethod(expense.getPaymentMethod());
        existing.setVendorName(expense.getVendorName());
        existing.setReferenceNumber(expense.getReferenceNumber());
        existing.setDescription(expense.getDescription());
        existing.setReceiptUrl(expense.getReceiptUrl());
        existing.setIsRecurring(expense.getIsRecurring());
        existing.setRecurringFrequency(expense.getRecurringFrequency());

        return expenseRepository.save(existing);
    }

    @Transactional
    public Expense approve(UUID id) {
        UUID orgId = TenantContext.requireTenantId();
        UUID userId = TenantContext.getUserId();

        Expense expense = getById(id);

        if (expense.getApproved()) {
            throw new BusinessException("INVALID_STATE", "Expense is already approved");
        }

        expense.setApproved(true);
        expense.setApprovedBy(userId != null ? userRepository.findById(userId).orElse(null) : null);
        expense.setApprovedAt(java.time.Instant.now());

        expense = expenseRepository.save(expense);

        log.info("Approved expense: {}", expense.getExpenseNumber());
        return expense;
    }

    @Transactional
    public void delete(UUID id) {
        UUID orgId = TenantContext.requireTenantId();
        Expense expense = getById(id);

        if (expense.getApproved()) {
            throw new BusinessException("INVALID_STATE", "Cannot delete approved expense");
        }

        expenseRepository.delete(expense);
        log.info("Deleted expense: {}", expense.getExpenseNumber());
    }
}
