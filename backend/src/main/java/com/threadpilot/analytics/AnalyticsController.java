package com.threadpilot.analytics;

import com.threadpilot.analytics.dto.ExpenseSummary;
import com.threadpilot.analytics.dto.ProductSalesSummary;
import com.threadpilot.analytics.dto.CustomerSalesSummary;
import com.threadpilot.common.dto.ApiResponse;
import com.threadpilot.sale.SaleRepository;
import com.threadpilot.security.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;
    private final SaleRepository saleRepository;

@GetMapping("/health-score")
    public ResponseEntity<ApiResponse<AnalyticsService.BusinessHealthScore>> getBusinessHealthScore() {
        AnalyticsService.BusinessHealthScore score = analyticsService.getBusinessHealthScore();
        return ResponseEntity.ok(ApiResponse.success(score));
    }

    // Alias for frontend: /analytics/business-health
    @GetMapping("/business-health")
    public ResponseEntity<ApiResponse<AnalyticsService.BusinessHealthScore>> getBusinessHealth() {
        return getBusinessHealthScore();
    }

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<AnalyticsService.DashboardMetrics>> getDashboardMetrics() {
        AnalyticsService.DashboardMetrics metrics = analyticsService.getDashboardMetrics();
        return ResponseEntity.ok(ApiResponse.success(metrics));
    }

    @GetMapping("/top-products")
    public ResponseEntity<ApiResponse<List<ProductSalesSummary>>> getTopSellingProducts(
            @RequestParam LocalDate start,
            @RequestParam LocalDate end,
            @RequestParam(defaultValue = "10") int limit
    ) {
        List<ProductSalesSummary> products = analyticsService.getTopSellingProducts(start, end, limit);
        return ResponseEntity.ok(ApiResponse.success(products));
    }

    @GetMapping("/top-customers")
    public ResponseEntity<ApiResponse<List<CustomerSalesSummary>>> getTopCustomers(
            @RequestParam LocalDate start,
            @RequestParam LocalDate end,
            @RequestParam(defaultValue = "10") int limit
    ) {
        List<CustomerSalesSummary> customers = analyticsService.getTopCustomers(start, end, limit);
        return ResponseEntity.ok(ApiResponse.success(customers));
    }

    @GetMapping("/expenses-by-category")
    public ResponseEntity<ApiResponse<List<ExpenseSummary>>> getExpensesByCategory(
            @RequestParam LocalDate start,
            @RequestParam LocalDate end
    ) {
        List<ExpenseSummary> expenses = analyticsService.getExpensesByCategory(start, end);
        return ResponseEntity.ok(ApiResponse.success(expenses));
    }

    @GetMapping("/revenue")
    public ResponseEntity<ApiResponse<BigDecimal>> getTotalRevenue(
            @RequestParam LocalDate start,
            @RequestParam LocalDate end
    ) {
        BigDecimal revenue = analyticsService.getTotalRevenue(start, end);
        return ResponseEntity.ok(ApiResponse.success(revenue));
    }

    @GetMapping("/gross-profit")
    public ResponseEntity<ApiResponse<BigDecimal>> getTotalGrossProfit(
            @RequestParam LocalDate start,
            @RequestParam LocalDate end
    ) {
        BigDecimal profit = analyticsService.getTotalGrossProfit(start, end);
        return ResponseEntity.ok(ApiResponse.success(profit));
    }

@GetMapping("/expenses")
    public ResponseEntity<ApiResponse<BigDecimal>> getTotalExpenses(
            @RequestParam LocalDate start,
            @RequestParam LocalDate end
    ) {
        BigDecimal expenses = analyticsService.getTotalExpenses(start, end);
        return ResponseEntity.ok(ApiResponse.success(expenses));
    }

    // Alias for frontend: /analytics/revenue-trend?period=
    @GetMapping("/revenue-trend")
    public ResponseEntity<ApiResponse<List<RevenueTrendPoint>>> getRevenueTrend(
            @RequestParam(defaultValue = "month") String period
    ) {
        LocalDate end = LocalDate.now();
        LocalDate start = switch (period) {
            case "week" -> end.minusWeeks(1);
            case "quarter" -> end.minusMonths(3);
            case "year" -> end.minusYears(1);
            default -> end.minusMonths(1); // month
        };

        List<RevenueTrendPoint> trend = buildRevenueTrend(start, end, period);
        return ResponseEntity.ok(ApiResponse.success(trend));
    }

    private List<RevenueTrendPoint> buildRevenueTrend(LocalDate start, LocalDate end, String period) {
        List<RevenueTrendPoint> points = new java.util.ArrayList<>();
        UUID orgId = TenantContext.requireTenantId();

        if ("week".equals(period)) {
            // Daily points for a week
            for (int i = 0; i < 7; i++) {
                LocalDate day = start.plusDays(i);
                BigDecimal revenue = saleRepository.getTotalRevenueByDateRange(orgId, day, day);
                points.add(RevenueTrendPoint.builder()
                        .period(day.toString())
                        .revenue(revenue != null ? revenue.doubleValue() : 0.0)
                        .build());
            }
        } else if ("month".equals(period)) {
            // Weekly points for a month (4 weeks)
            for (int i = 0; i < 4; i++) {
                LocalDate weekStart = start.plusWeeks(i);
                LocalDate weekEnd = weekStart.plusDays(6);
                if (weekEnd.isAfter(end)) weekEnd = end;
                BigDecimal revenue = saleRepository.getTotalRevenueByDateRange(orgId, weekStart, weekEnd);
                points.add(RevenueTrendPoint.builder()
                        .period(weekStart + " to " + weekEnd)
                        .revenue(revenue != null ? revenue.doubleValue() : 0.0)
                        .build());
            }
        } else {
            // Monthly points for quarter/year
            LocalDate current = start.withDayOfMonth(1);
            while (!current.isAfter(end)) {
                LocalDate monthEnd = current.withDayOfMonth(current.lengthOfMonth());
                if (monthEnd.isAfter(end)) monthEnd = end;
                BigDecimal revenue = saleRepository.getTotalRevenueByDateRange(orgId, current, monthEnd);
                points.add(RevenueTrendPoint.builder()
                        .period(current.getMonth().toString() + " " + current.getYear())
                        .revenue(revenue != null ? revenue.doubleValue() : 0.0)
                        .build());
                current = current.plusMonths(1);
            }
        }
        return points;
    }

    // Alias for frontend: /analytics/sales-by-category
    @GetMapping("/sales-by-category")
    public ResponseEntity<ApiResponse<List<ProductSalesSummary>>> getSalesByCategory(
            @RequestParam(required = false) LocalDate start,
            @RequestParam(required = false) LocalDate end
    ) {
        LocalDate endDate = end != null ? end : LocalDate.now();
        LocalDate startDate = start != null ? start : endDate.minusMonths(1);
        List<ProductSalesSummary> salesByCategory = analyticsService.getSalesByCategory(startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(salesByCategory));
    }

    @lombok.Builder
    @lombok.Data
    public static class RevenueTrendPoint {
        private String period;
        private double revenue;
    }
}

