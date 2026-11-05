package com.threadpilot.dashboard;

import com.threadpilot.alert.Alert;
import com.threadpilot.alert.AlertRepository;
import com.threadpilot.analytics.AnalyticsService;
import com.threadpilot.common.dto.ApiResponse;
import com.threadpilot.inventory.InventoryRepository;
import com.threadpilot.inventory.InventoryService;
import com.threadpilot.order.CustomerOrderRepository;
import com.threadpilot.payment.PaymentRepository;
import com.threadpilot.sale.SaleRepository;
import com.threadpilot.security.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final AnalyticsService analyticsService;
    private final InventoryRepository inventoryRepository;
    private final InventoryService inventoryService;
    private final SaleRepository saleRepository;
    private final CustomerOrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final AlertRepository alertRepository;

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<DashboardStats>> getStats() {
        UUID orgId = TenantContext.requireTenantId();
        AnalyticsService.DashboardMetrics metrics = analyticsService.getDashboardMetrics();

        DashboardStats stats = DashboardStats.builder()
                .totalRevenue(metrics.getAllTimeSalesCount() != null && metrics.getAllTimeSalesCount() > 0
                        ? saleRepository.getTotalRevenueAllTime(orgId).doubleValue()
                        : 0.0)
                .totalSales(metrics.getAllTimeSalesCount() != null ? metrics.getAllTimeSalesCount().intValue() : 0)
                .outstandingPayments(metrics.getTotalReceivables() != null ? metrics.getTotalReceivables().doubleValue() : 0.0)
                .inventoryValue(metrics.getInventoryValue() != null ? metrics.getInventoryValue().doubleValue() : 0.0)
                .lowStockItems(metrics.getLowStockCount() != null ? metrics.getLowStockCount().intValue() : 0)
                .build();

        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    @GetMapping("/recent-sales")
    public ResponseEntity<ApiResponse<List<RecentSale>>> getRecentSales() {
        UUID orgId = TenantContext.requireTenantId();
        LocalDate today = LocalDate.now();
        LocalDate startOfMonth = today.withDayOfMonth(1);

        List<RecentSale> recentSales = saleRepository.findByDateRange(orgId, startOfMonth, today)
                .stream()
                .map(s -> RecentSale.builder()
                        .id(s.getId().toString())
                        .saleNumber(s.getSaleNumber())
                        .saleDate(s.getSaleDate().toString())
                        .totalAmount(s.getTotalAmount().doubleValue())
                        .customerName(s.getCustomer() != null ? s.getCustomer().getName() : null)
                        .build())
                .limit(10)
                .collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.success(recentSales));
    }

    @GetMapping("/recent-orders")
    public ResponseEntity<ApiResponse<List<RecentOrder>>> getRecentOrders() {
        UUID orgId = TenantContext.requireTenantId();
        LocalDate today = LocalDate.now();
        LocalDate startOfMonth = today.withDayOfMonth(1);

        List<RecentOrder> recentOrders = orderRepository.findByDateRange(orgId, startOfMonth, today)
                .stream()
                .map(o -> RecentOrder.builder()
                        .id(o.getId().toString())
                        .orderNumber(o.getOrderNumber())
                        .orderDate(o.getOrderDate().toString())
                        .totalAmount(o.getTotalAmount().doubleValue())
                        .customerName(o.getCustomer() != null ? o.getCustomer().getName() : null)
                        .status(o.getStatus().name())
                        .build())
                .limit(10)
                .collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.success(recentOrders));
    }

    @GetMapping("/low-stock")
    public ResponseEntity<ApiResponse<List<LowStockProduct>>> getLowStock() {
        UUID orgId = TenantContext.requireTenantId();
        List<LowStockProduct> lowStock = inventoryRepository.findLowStock(orgId, 10)
                .stream()
                .map(i -> LowStockProduct.builder()
                        .id(i.getId().toString())
                        .sku(i.getProduct() != null ? i.getProduct().getSku() : i.getVariant().getSku())
                        .name(i.getProduct() != null ? i.getProduct().getName() : "Variant")
                        .availableQuantity(i.getAvailableQuantity())
                        .minStockLevel(i.getProduct() != null ? i.getProduct().getMinStockLevel() : i.getVariant().getMinStockLevel())
                        .build())
                .collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.success(lowStock));
    }

    @GetMapping("/pending-payments")
    public ResponseEntity<ApiResponse<List<PendingPayment>>> getPendingPayments() {
        UUID orgId = TenantContext.requireTenantId();

        List<PendingPayment> pending = orderRepository.findWithOutstanding(orgId)
                .stream()
                .map(o -> PendingPayment.builder()
                        .id(o.getId().toString())
                        .paymentNumber(o.getOrderNumber())
                        .paymentDate(o.getOrderDate().toString())
                        .amount(o.getOutstandingAmount().doubleValue())
                        .customerName(o.getCustomer() != null ? o.getCustomer().getName() : null)
                        .supplierName(null)
                        .build())
                .limit(10)
                .collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.success(pending));
    }

    @GetMapping("/alerts")
    public ResponseEntity<ApiResponse<List<BusinessAlert>>> getAlerts() {
        UUID orgId = TenantContext.requireTenantId();
        List<BusinessAlert> alerts = alertRepository.findUnreadByOrganizationId(orgId, PageRequest.of(0, 10))
                .stream()
                .map(a -> BusinessAlert.builder()
                        .id(a.getId().toString())
                        .alertType(a.getAlertType().name())
                        .severity(a.getSeverity().name())
                        .title(a.getTitle())
                        .message(a.getMessage())
                        .createdAt(a.getCreatedAt().toString())
                        .build())
                .collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.success(alerts));
    }

    @lombok.Builder
    @lombok.Data
    public static class DashboardStats {
        private double totalRevenue;
        private int totalSales;
        private double outstandingPayments;
        private double inventoryValue;
        private int lowStockItems;
    }

    @lombok.Builder
    @lombok.Data
    public static class RecentSale {
        private String id;
        private String saleNumber;
        private String saleDate;
        private double totalAmount;
        private String customerName;
    }

    @lombok.Builder
    @lombok.Data
    public static class RecentOrder {
        private String id;
        private String orderNumber;
        private String orderDate;
        private double totalAmount;
        private String customerName;
        private String status;
    }

    @lombok.Builder
    @lombok.Data
    public static class LowStockProduct {
        private String id;
        private String sku;
        private String name;
        private int availableQuantity;
        private int minStockLevel;
    }

    @lombok.Builder
    @lombok.Data
    public static class PendingPayment {
        private String id;
        private String paymentNumber;
        private String paymentDate;
        private double amount;
        private String customerName;
        private String supplierName;
    }

    @lombok.Builder
    @lombok.Data
    public static class BusinessAlert {
        private String id;
        private String alertType;
        private String severity;
        private String title;
        private String message;
        private String createdAt;
    }
}
