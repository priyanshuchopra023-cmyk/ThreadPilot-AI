package com.threadpilot.analytics;

import com.threadpilot.analytics.dto.ExpenseSummary;
import com.threadpilot.analytics.dto.ProductSalesSummary;
import com.threadpilot.analytics.dto.CustomerSalesSummary;
import com.threadpilot.common.exception.BusinessException;
import com.threadpilot.common.exception.ResourceNotFoundException;
import com.threadpilot.customer.CustomerRepository;
import com.threadpilot.event.BusinessEvent;
import com.threadpilot.event.BusinessEventRepository;
import com.threadpilot.event.EventType;
import com.threadpilot.event.EventSeverity;
import com.threadpilot.expense.ExpenseRepository;
import com.threadpilot.inventory.InventoryRepository;
import com.threadpilot.inventory.InventoryService;
import com.threadpilot.inventory.MovementType;
import com.threadpilot.inventory.StockMovementRepository;
import com.threadpilot.organization.Organization;
import com.threadpilot.payment.PaymentRepository;
import com.threadpilot.product.ProductRepository;
import com.threadpilot.sale.SaleRepository;
import com.threadpilot.security.TenantContext;
import com.threadpilot.supplier.SupplierRepository;
import com.threadpilot.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AnalyticsService {

private final SaleRepository saleRepository;
    private final PaymentRepository paymentRepository;
    private final InventoryRepository inventoryRepository;
    private final StockMovementRepository stockMovementRepository;
    private final ProductRepository productRepository;
    private final SupplierRepository supplierRepository;
    private final ExpenseRepository expenseRepository;
    private final UserRepository userRepository;
    private final BusinessEventRepository businessEventRepository;
    private final CustomerRepository customerRepository;

    @Transactional(readOnly = true)
    public BusinessHealthScore getBusinessHealthScore() {
        UUID orgId = TenantContext.requireTenantId();

        BigDecimal inventoryScore = calculateInventoryHealth(orgId);
        BigDecimal salesScore = calculateSalesHealth(orgId);
        BigDecimal collectionsScore = calculateCollectionsHealth(orgId);
        BigDecimal profitabilityScore = calculateProfitabilityHealth(orgId);
        BigDecimal slowMovingScore = calculateSlowMovingHealth(orgId);

        BigDecimal totalScore = inventoryScore.multiply(BigDecimal.valueOf(0.25))
                .add(salesScore.multiply(BigDecimal.valueOf(0.20)))
                .add(collectionsScore.multiply(BigDecimal.valueOf(0.20)))
                .add(profitabilityScore.multiply(BigDecimal.valueOf(0.20)))
                .add(slowMovingScore.multiply(BigDecimal.valueOf(0.15)));

        return BusinessHealthScore.builder()
                .overallScore(totalScore.setScale(0, RoundingMode.HALF_UP).intValue())
                .inventoryHealth(inventoryScore.setScale(0, RoundingMode.HALF_UP).intValue())
                .salesHealth(salesScore.setScale(0, RoundingMode.HALF_UP).intValue())
                .collectionsHealth(collectionsScore.setScale(0, RoundingMode.HALF_UP).intValue())
                .profitabilityHealth(profitabilityScore.setScale(0, RoundingMode.HALF_UP).intValue())
                .slowMovingHealth(slowMovingScore.setScale(0, RoundingMode.HALF_UP).intValue())
                .build();
    }

@Transactional(readOnly = true)
    public DashboardMetrics getDashboardMetrics() {
        UUID orgId = TenantContext.requireTenantId();
        LocalDate today = LocalDate.now();
        LocalDate startOfMonth = today.withDayOfMonth(1);
        LocalDate startOfPrevMonth = startOfMonth.minusMonths(1);
        LocalDate endOfPrevMonth = startOfMonth.minusDays(1);

        BigDecimal todaySales = saleRepository.getTotalRevenueByDateRange(orgId, today, today);
        BigDecimal monthSales = saleRepository.getTotalRevenueByDateRange(orgId, startOfMonth, today);
        BigDecimal prevMonthSales = saleRepository.getTotalRevenueByDateRange(orgId, startOfPrevMonth, endOfPrevMonth);
        BigDecimal monthGrossProfit = saleRepository.getTotalGrossProfitByDateRange(orgId, startOfMonth, today);

        BigDecimal totalReceivables = getTotalReceivables(orgId);
        BigDecimal totalPayables = getTotalPayables(orgId);
        BigDecimal inventoryValue = inventoryRepository.getTotalInventoryValue(orgId);

        Long lowStockCount = inventoryRepository.countLowStock(orgId, 10);
        Long slowMovingCount = productRepository.countSlowMoving(orgId, LocalDate.now().minusDays(90));

        // Sales counts
        Long todaySalesCount = saleRepository.countByDateRange(orgId, today, today);
        Long monthSalesCount = saleRepository.countByDateRange(orgId, startOfMonth, today);
        Long allTimeSalesCount = saleRepository.countAllByOrganizationId(orgId);

        return DashboardMetrics.builder()
                .todaySales(todaySales)
                .monthSales(monthSales)
                .prevMonthSales(prevMonthSales)
                .monthGrossProfit(monthGrossProfit)
                .totalReceivables(totalReceivables)
                .totalPayables(totalPayables)
                .inventoryValue(inventoryValue)
                .lowStockCount(lowStockCount)
                .slowMovingCount(slowMovingCount)
                .todaySalesCount(todaySalesCount)
                .monthSalesCount(monthSalesCount)
                .allTimeSalesCount(allTimeSalesCount)
                .build();
    }

    @Transactional(readOnly = true)
    public List<ProductSalesSummary> getTopSellingProducts(LocalDate start, LocalDate end, int limit) {
        UUID orgId = TenantContext.requireTenantId();
        return saleRepository.getTopSellingProducts(orgId, start, end, org.springframework.data.domain.PageRequest.of(0, limit));
    }

    @Transactional(readOnly = true)
    public List<CustomerSalesSummary> getTopCustomers(LocalDate start, LocalDate end, int limit) {
        UUID orgId = TenantContext.requireTenantId();
        return saleRepository.getTopCustomers(orgId, start, end, org.springframework.data.domain.PageRequest.of(0, limit));
    }

    @Transactional(readOnly = true)
    public List<ExpenseSummary> getExpensesByCategory(LocalDate start, LocalDate end) {
        UUID orgId = TenantContext.requireTenantId();
        return expenseRepository.getExpensesByCategory(orgId, start, end);
    }

    @Transactional(readOnly = true)
    public BigDecimal getTotalRevenue(LocalDate start, LocalDate end) {
        UUID orgId = TenantContext.requireTenantId();
        return saleRepository.getTotalRevenueByDateRange(orgId, start, end);
    }

    @Transactional(readOnly = true)
    public BigDecimal getTotalGrossProfit(LocalDate start, LocalDate end) {
        UUID orgId = TenantContext.requireTenantId();
        return saleRepository.getTotalGrossProfitByDateRange(orgId, start, end);
    }

@Transactional(readOnly = true)
    public BigDecimal getTotalExpenses(LocalDate start, LocalDate end) {
        UUID orgId = TenantContext.requireTenantId();
        return expenseRepository.getTotalByDateRange(orgId, start, end);
    }

    @Transactional(readOnly = true)
    public List<com.threadpilot.analytics.dto.ProductSalesSummary> getSalesByCategory(LocalDate start, LocalDate end) {
        UUID orgId = TenantContext.requireTenantId();
        return saleRepository.getSalesByCategory(orgId, start, end);
    }

@Transactional(readOnly = true)
    public BigDecimal getTotalReceivables(UUID orgId) {
        BigDecimal total = customerRepository.getTotalOutstanding(orgId);
        return total != null ? total : BigDecimal.ZERO;
    }

    @Transactional(readOnly = true)
    public BigDecimal getTotalPayables(UUID orgId) {
        BigDecimal total = supplierRepository.getTotalOutstanding(orgId);
        return total != null ? total : BigDecimal.ZERO;
    }

    private BigDecimal calculateInventoryHealth(UUID orgId) {
        Long totalProducts = productRepository.countActiveByOrganizationId(orgId);
        Long lowStockCount = inventoryRepository.countLowStock(orgId, 10);

        if (totalProducts == 0) return BigDecimal.valueOf(100);

        BigDecimal health = BigDecimal.valueOf(100).subtract(
                BigDecimal.valueOf(lowStockCount).multiply(BigDecimal.valueOf(100)).divide(BigDecimal.valueOf(totalProducts), 4, RoundingMode.HALF_UP)
        );
        return health.max(BigDecimal.ZERO).min(BigDecimal.valueOf(100));
    }

    private BigDecimal calculateSalesHealth(UUID orgId) {
        LocalDate today = LocalDate.now();
        LocalDate startOfMonth = today.withDayOfMonth(1);
        LocalDate startOfPrevMonth = startOfMonth.minusMonths(1);
        LocalDate endOfPrevMonth = startOfMonth.minusDays(1);

        BigDecimal currentMonthSales = saleRepository.getTotalRevenueByDateRange(orgId, startOfMonth, today);
        BigDecimal prevMonthSales = saleRepository.getTotalRevenueByDateRange(orgId, startOfPrevMonth, endOfPrevMonth);

        if (currentMonthSales == null) {
            currentMonthSales = BigDecimal.ZERO;
        }
        if (prevMonthSales == null || prevMonthSales.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.valueOf(75); // Neutral score
        }

        BigDecimal growthRate = currentMonthSales.subtract(prevMonthSales).divide(prevMonthSales, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100));

        // Score based on growth: -50% = 0, 0% = 50, 50% = 100
        BigDecimal score = BigDecimal.valueOf(50).add(growthRate);
        return score.max(BigDecimal.ZERO).min(BigDecimal.valueOf(100));
    }

    private BigDecimal calculateCollectionsHealth(UUID orgId) {
        BigDecimal totalReceivables = getTotalReceivables(orgId);
        BigDecimal totalPayables = getTotalPayables(orgId);

        if (totalReceivables.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.valueOf(100);
        }

        // Simple ratio: if receivables > payables, good health
        BigDecimal ratio = totalPayables.divide(totalReceivables, 4, RoundingMode.HALF_UP);
        BigDecimal score = BigDecimal.valueOf(100).subtract(ratio.multiply(BigDecimal.valueOf(50)));
        return score.max(BigDecimal.ZERO).min(BigDecimal.valueOf(100));
    }

    private BigDecimal calculateProfitabilityHealth(UUID orgId) {
        LocalDate startOfMonth = LocalDate.now().withDayOfMonth(1);
        LocalDate today = LocalDate.now();

        BigDecimal revenue = saleRepository.getTotalRevenueByDateRange(orgId, startOfMonth, today);
        BigDecimal grossProfit = saleRepository.getTotalGrossProfitByDateRange(orgId, startOfMonth, today);

        if (revenue == null || revenue.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.valueOf(50);
        }

        BigDecimal margin = grossProfit.divide(revenue, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100));

        // Score: 0% margin = 0, 20% = 50, 40% = 100
        BigDecimal score = margin.multiply(BigDecimal.valueOf(2.5));
        return score.max(BigDecimal.ZERO).min(BigDecimal.valueOf(100));
    }

private BigDecimal calculateSlowMovingHealth(UUID orgId) {
        Long totalProducts = productRepository.countActiveByOrganizationId(orgId);
        Long slowMovingCount = productRepository.countSlowMoving(orgId, LocalDate.now().minusDays(90));

        if (totalProducts == 0) return BigDecimal.valueOf(100);

        BigDecimal health = BigDecimal.valueOf(100).subtract(
                BigDecimal.valueOf(slowMovingCount).multiply(BigDecimal.valueOf(100)).divide(BigDecimal.valueOf(totalProducts), 4, RoundingMode.HALF_UP)
        );
        return health.max(BigDecimal.ZERO).min(BigDecimal.valueOf(100));
    }

    @lombok.Builder
    @lombok.Data
    public static class BusinessHealthScore {
        private int overallScore;
        private int inventoryHealth;
        private int salesHealth;
        private int collectionsHealth;
        private int profitabilityHealth;
        private int slowMovingHealth;
    }

@lombok.Builder
    @lombok.Data
    public static class DashboardMetrics {
        private BigDecimal todaySales;
        private BigDecimal monthSales;
        private BigDecimal prevMonthSales;
        private BigDecimal monthGrossProfit;
        private BigDecimal totalReceivables;
        private BigDecimal totalPayables;
        private BigDecimal inventoryValue;
        private Long lowStockCount;
        private Long slowMovingCount;
        private Long todaySalesCount;
        private Long monthSalesCount;
        private Long allTimeSalesCount;
    }
}

