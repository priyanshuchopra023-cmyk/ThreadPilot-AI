package com.threadpilot.expense;

import com.threadpilot.analytics.dto.ExpenseSummary;
import com.threadpilot.common.dto.ApiResponse;
import com.threadpilot.common.dto.PageResponse;
import com.threadpilot.common.dto.PaginationRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/expenses")
@RequiredArgsConstructor
public class ExpenseController {

    private final ExpenseService expenseService;

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<Expense>>> getAll(PaginationRequest request) {
        PageResponse<Expense> page = expenseService.getAll(request);
        return ResponseEntity.ok(ApiResponse.success(page));
    }

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<List<ExpenseSummary>>> getSummary(
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate
    ) {
        List<ExpenseSummary> summary = expenseService.getExpensesSummary(startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(summary));
    }

    @GetMapping("/category/{category}")
    public ResponseEntity<ApiResponse<PageResponse<Expense>>> getByCategory(
            @PathVariable ExpenseCategory category,
            PaginationRequest request
    ) {
        PageResponse<Expense> page = expenseService.getByCategory(category, request);
        return ResponseEntity.ok(ApiResponse.success(page));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Expense>> getById(@PathVariable UUID id) {
        Expense expense = expenseService.getById(id);
        return ResponseEntity.ok(ApiResponse.success(expense));
    }

    @GetMapping("/date-range")
    public ResponseEntity<ApiResponse<List<Expense>>> getByDateRange(
            @RequestParam LocalDate start,
            @RequestParam LocalDate end
    ) {
        List<Expense> expenses = expenseService.getByDateRange(start, end);
        return ResponseEntity.ok(ApiResponse.success(expenses));
    }

    @GetMapping("/total")
    public ResponseEntity<ApiResponse<BigDecimal>> getTotalByDateRange(
            @RequestParam LocalDate start,
            @RequestParam LocalDate end
    ) {
        BigDecimal total = expenseService.getTotalByDateRange(start, end);
        return ResponseEntity.ok(ApiResponse.success(total));
    }

    @GetMapping("/category/{category}/total")
    public ResponseEntity<ApiResponse<BigDecimal>> getTotalByCategoryAndDateRange(
            @PathVariable ExpenseCategory category,
            @RequestParam LocalDate start,
            @RequestParam LocalDate end
    ) {
        BigDecimal total = expenseService.getTotalByCategoryAndDateRange(category, start, end);
        return ResponseEntity.ok(ApiResponse.success(total));
    }

    @GetMapping("/by-category")
    public ResponseEntity<ApiResponse<List<ExpenseSummary>>> getExpensesByCategory(
            @RequestParam LocalDate start,
            @RequestParam LocalDate end
    ) {
        List<ExpenseSummary> summary = expenseService.getExpensesByCategory(start, end);
        return ResponseEntity.ok(ApiResponse.success(summary));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER', 'ACCOUNTANT')")
    public ResponseEntity<ApiResponse<Expense>> create(@RequestBody Expense expense) {
        Expense created = expenseService.create(expense);
        return ResponseEntity.ok(ApiResponse.success(created, "Expense created successfully"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER', 'ACCOUNTANT')")
    public ResponseEntity<ApiResponse<Expense>> update(@PathVariable UUID id, @RequestBody Expense expense) {
        Expense updated = expenseService.update(id, expense);
        return ResponseEntity.ok(ApiResponse.success(updated, "Expense updated successfully"));
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER', 'ACCOUNTANT')")
    public ResponseEntity<ApiResponse<Expense>> approve(@PathVariable UUID id) {
        Expense approved = expenseService.approve(id);
        return ResponseEntity.ok(ApiResponse.success(approved, "Expense approved successfully"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        expenseService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Expense deleted successfully"));
    }
}
