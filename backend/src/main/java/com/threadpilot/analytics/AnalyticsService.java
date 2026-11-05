package com.threadpilot.analytics;

import com.threadpilot.analytics.dto.ExpenseSummary;
import com.threadpilot.analytics.dto.ProductSalesSummary;
import com.threadpilot.analytics.dto.CustomerSalesSummary;
import com.threadpilot.common.exception.BusinessException;
import com.threadpilot.common.exception.ResourceNotFoundException;
import com.threadpilot.customer.Customer;
import com.threadpilot.customer.CustomerRepository;
import com.threadpilot.event.BusinessEvent;
import com.threadpilot.event.BusinessEventRepository;
import com.threadpilot.event.EventType;
import com.threadpilot.event.EventSeverity;
import com.threadpilot.expense.ExpenseRepository;
import com.threadpilot.inventory.Inventory;
import com.threadpilot.inventory.InventoryRepository;
import com.threadpilot.inventory.InventoryService;
import com.threadpilot.inventory.MovementType;
import com.threadpilot.inventory.StockMovementRepository;
import com.threadpilot.invoice.SupplierInvoice;
import com.threadpilot.invoice.SupplierInvoiceRepository;
import com.threadpilot.order.CustomerOrder;
import com.threadpilot.order.CustomerOrderRepository;
import com.threadpilot.organization.Organization;
import com.threadpilot.payment.PaymentRepository;
import com.threadpilot.product.Product;
import com.threadpilot.product.ProductRepository;
import com.threadpilot.sale.SaleRepository;
import com.threadpilot.security.TenantContext;
import com.threadpilot.supplier.SupplierRepository;
import com.threadpilot.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

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
    private final CustomerOrderRepository orderRepository;
    private final SupplierInvoiceRepository invoiceRepository;

    @Transactional(readOnly = true)
    public BusinessHealthScore getBusinessHealthScore() {
        UUID orgId = TenantContext.requireTenantId();

        BigDecimal inventoryScore = calculateInventoryHealth(orgId);
        BigDecimal salesScore = calculateSalesHealth(orgId);
        BigDecimal collectionsScore = calculateCollectionsHealth(orgId);
        BigDecimal profitabilityScore = calculateProfitabilityHealth(orgId);
        BigDecimal slowMovingScore = calculateSlowMovingHealth(orgId);

        BigDecimal weightedSum = BigDecimal.ZERO;
        BigDecimal totalWeight = BigDecimal.ZERO;

        if (inventoryScore != null) {
            weightedSum = weightedSum.add(inventoryScore.multiply(BigDecimal.valueOf(0.25)));
            totalWeight = totalWeight.add(BigDecimal.valueOf(0.25));
        }
        if (salesScore != null) {
            weightedSum = weightedSum.add(salesScore.multiply(BigDecimal.valueOf(0.20)));
            totalWeight = totalWeight.add(BigDecimal.valueOf(0.20));
        }
        if (collectionsScore != null) {
            weightedSum = weightedSum.add(collectionsScore.multiply(BigDecimal.valueOf(0.20)));
            totalWeight = totalWeight.add(BigDecimal.valueOf(0.20));
        }
        if (profitabilityScore != null) {
            weightedSum = weightedSum.add(profitabilityScore.multiply(BigDecimal.valueOf(0.20)));
            totalWeight = totalWeight.add(BigDecimal.valueOf(0.20));
        }
        if (slowMovingScore != null) {
            weightedSum = weightedSum.add(slowMovingScore.multiply(BigDecimal.valueOf(0.15)));
            totalWeight = totalWeight.add(BigDecimal.valueOf(0.15));
        }

        Integer overallScore = null;
        boolean hasSufficientData = totalWeight.compareTo(BigDecimal.ZERO) > 0;
        String statusMessage = hasSufficientData
                ? "Operational index calculated from active business metrics"
                : "Not enough data to calculate operational baseline";

        if (hasSufficientData) {
            overallScore = weightedSum.divide(totalWeight, 4, RoundingMode.HALF_UP)
                    .setScale(0, RoundingMode.HALF_UP).intValue();
        }

        return BusinessHealthScore.builder()
                .overallScore(overallScore)
                .inventoryHealth(inventoryScore != null ? inventoryScore.setScale(0, RoundingMode.HALF_UP).intValue() : null)
                .salesHealth(salesScore != null ? salesScore.setScale(0, RoundingMode.HALF_UP).intValue() : null)
                .collectionsHealth(collectionsScore != null ? collectionsScore.setScale(0, RoundingMode.HALF_UP).intValue() : null)
                .profitabilityHealth(profitabilityScore != null ? profitabilityScore.setScale(0, RoundingMode.HALF_UP).intValue() : null)
                .slowMovingHealth(slowMovingScore != null ? slowMovingScore.setScale(0, RoundingMode.HALF_UP).intValue() : null)
                .hasSufficientData(hasSufficientData)
                .statusMessage(statusMessage)
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

    public LocalDate calculateOrderDueDate(CustomerOrder order) {
        if (order.getExpectedDeliveryDate() != null) {
            return order.getExpectedDeliveryDate();
        }
        int days = 30; // default 30 days
        if (order.getCustomer() != null && order.getCustomer().getPaymentTerms() != null) {
            String terms = order.getCustomer().getPaymentTerms().toUpperCase().trim();
            try {
                if (terms.startsWith("NET_") || terms.startsWith("NET-") || terms.startsWith("NET ")) {
                    days = Integer.parseInt(terms.substring(4).trim());
                } else if (terms.matches("\\d+")) {
                    days = Integer.parseInt(terms);
                }
            } catch (Exception ignored) {
                days = 30;
            }
        }
        LocalDate baseDate = order.getOrderDate() != null ? order.getOrderDate() : LocalDate.now();
        return baseDate.plusDays(days);
    }

    @Transactional(readOnly = true)
    public ReceivablesAging getReceivablesAging() {
        UUID orgId = TenantContext.requireTenantId();
        LocalDate today = LocalDate.now();

        List<CustomerOrder> orders = orderRepository.findWithOutstanding(orgId);

        BigDecimal current0To30 = BigDecimal.ZERO;
        BigDecimal overdue31To60 = BigDecimal.ZERO;
        BigDecimal overdue61To90 = BigDecimal.ZERO;
        BigDecimal overdue90Plus = BigDecimal.ZERO;
        BigDecimal totalReceivables = BigDecimal.ZERO;

        Map<UUID, CustomerAgingSummary> customerMap = new HashMap<>();

        for (CustomerOrder o : orders) {
            BigDecimal outstanding = o.getOutstandingAmount();
            if (outstanding == null || outstanding.compareTo(BigDecimal.ZERO) <= 0) continue;

            totalReceivables = totalReceivables.add(outstanding);
            LocalDate dueDate = calculateOrderDueDate(o);
            long overdueDays = java.time.temporal.ChronoUnit.DAYS.between(dueDate, today);

            // Overdue aging relative to due date (<= 30 days includes not-yet-due or 0-30 days overdue)
            if (overdueDays <= 30) {
                current0To30 = current0To30.add(outstanding);
            } else if (overdueDays <= 60) {
                overdue31To60 = overdue31To60.add(outstanding);
            } else if (overdueDays <= 90) {
                overdue61To90 = overdue61To90.add(outstanding);
            } else {
                overdue90Plus = overdue90Plus.add(outstanding);
            }

            if (o.getCustomer() != null) {
                Customer c = o.getCustomer();
                int effectiveOverdue = (int) Math.max(0, overdueDays);
                CustomerAgingSummary summary = customerMap.computeIfAbsent(c.getId(), id -> CustomerAgingSummary.builder()
                        .customerId(c.getId())
                        .customerName(c.getName())
                        .outstanding(BigDecimal.ZERO)
                        .creditLimit(c.getCreditLimit())
                        .daysOverdue(effectiveOverdue)
                        .earliestDueDate(dueDate)
                        .build());
                summary.setOutstanding(summary.getOutstanding().add(outstanding));
                if (effectiveOverdue > summary.getDaysOverdue()) {
                    summary.setDaysOverdue(effectiveOverdue);
                }
                if (summary.getEarliestDueDate() == null || (dueDate != null && dueDate.isBefore(summary.getEarliestDueDate()))) {
                    summary.setEarliestDueDate(dueDate);
                }
            }
        }

        return ReceivablesAging.builder()
                .current0To30(current0To30)
                .overdue31To60(overdue31To60)
                .overdue61To90(overdue61To90)
                .overdue90Plus(overdue90Plus)
                .totalReceivables(totalReceivables)
                .customerSummaries(new ArrayList<>(customerMap.values()))
                .build();
    }

    @Transactional(readOnly = true)
    public List<CustomerIntelligence> getCustomerCreditIntelligence() {
        UUID orgId = TenantContext.requireTenantId();
        LocalDate today = LocalDate.now();

        List<Customer> customers = customerRepository.findActiveByOrganizationId(orgId, Pageable.unpaged()).getContent();
        List<CustomerIntelligence> list = new ArrayList<>();

        for (Customer c : customers) {
            List<CustomerOrder> customerOrders = orderRepository.findByCustomerId(c.getId(), orgId, Pageable.unpaged()).getContent();
            BigDecimal totalSales = customerOrders.stream()
                    .map(CustomerOrder::getTotalAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal outstanding = c.getOutstandingAmount() != null ? c.getOutstandingAmount() : BigDecimal.ZERO;
            BigDecimal creditLimit = c.getCreditLimit() != null ? c.getCreditLimit() : BigDecimal.ZERO;

            Integer avgInterval = null;
            Integer daysSinceLastOrder = null;
            boolean hasAdequateHistory = customerOrders.size() >= 2;
            boolean cycleInterrupted = false;

            if (!customerOrders.isEmpty()) {
                List<LocalDate> dates = customerOrders.stream().map(CustomerOrder::getOrderDate).sorted().toList();
                LocalDate latest = dates.get(dates.size() - 1);
                daysSinceLastOrder = (int) java.time.temporal.ChronoUnit.DAYS.between(latest, today);

                if (hasAdequateHistory) {
                    long totalDays = java.time.temporal.ChronoUnit.DAYS.between(dates.get(0), latest);
                    avgInterval = (int) (totalDays / (dates.size() - 1));
                    if (avgInterval > 0 && daysSinceLastOrder > (int) (1.5 * avgInterval)) {
                        cycleInterrupted = true;
                    }
                }
            }

            String segment;
            String recommendation;

            if (creditLimit.compareTo(BigDecimal.ZERO) > 0 && outstanding.compareTo(creditLimit) > 0) {
                segment = "CREDIT_LIMIT_BREACHED";
                recommendation = "Outstanding balance (₹" + outstanding + ") exceeds credit limit (₹" + creditLimit + "). Halt new dispatches and request settlement.";
            } else if (totalSales.compareTo(BigDecimal.valueOf(50000)) > 0 && outstanding.compareTo(BigDecimal.valueOf(20000)) > 0) {
                segment = "HIGH_SALES_POOR_COLLECTION";
                recommendation = "High sales account with delinquent payment (₹" + outstanding + "). Prioritize collections before next dispatch.";
            } else if (outstanding.compareTo(BigDecimal.ZERO) <= 0 && cycleInterrupted) {
                segment = "REACTIVATION_OPPORTUNITY";
                recommendation = "Clean credit customer with paused ordering cycle (" + daysSinceLastOrder + " days vs historical avg " + avgInterval + " days). Outreach with new seasonal catalogue.";
            } else if (!hasAdequateHistory) {
                segment = "NEW_ACCOUNT";
                recommendation = "New account with preliminary order history. Monitor satisfaction and build regular ordering cadence.";
            } else if (totalSales.compareTo(BigDecimal.valueOf(50000)) > 0) {
                segment = "CHAMPION";
                recommendation = "Key reliable customer with strong volume and healthy collection ratio.";
            } else {
                segment = "REGULAR";
                recommendation = "Standard trading account within expected parameters.";
            }

            list.add(CustomerIntelligence.builder()
                    .customerId(c.getId())
                    .customerName(c.getName())
                    .businessName(c.getBusinessName())
                    .totalSales(totalSales)
                    .outstandingBalance(outstanding)
                    .creditLimit(creditLimit)
                    .orderCount(customerOrders.size())
                    .avgOrderIntervalDays(avgInterval)
                    .daysSinceLastOrder(daysSinceLastOrder)
                    .hasAdequateHistory(hasAdequateHistory)
                    .cycleInterrupted(cycleInterrupted)
                    .segment(segment)
                    .recommendation(recommendation)
                    .build());
        }

        return list;
    }

    @Transactional(readOnly = true)
    public List<ActionItem> getDailyActionCenter() {
        UUID orgId = TenantContext.requireTenantId();
        List<ActionItem> items = new ArrayList<>();
        LocalDate today = LocalDate.now();

        // 1. Critical stockouts
        List<Inventory> outOfStock = inventoryRepository.findOutOfStock(orgId);
        for (Inventory inv : outOfStock) {
            String name = inv.getProduct() != null ? inv.getProduct().getName() : (inv.getVariant() != null ? inv.getVariant().getSku() : "Unknown");
            items.add(ActionItem.builder()
                    .priority("HIGH")
                    .category("INVENTORY")
                    .title("Stockout: " + name)
                    .reason("Item is completely out of stock with active order demand.")
                    .entityType("INVENTORY")
                    .entityId(inv.getId())
                    .actionUrl("/inventory")
                    .build());
        }

        // 2. High-sales customers with poor collections / credit limit breach
        List<CustomerIntelligence> intel = getCustomerCreditIntelligence();
        for (CustomerIntelligence ci : intel) {
            if ("HIGH_SALES_POOR_COLLECTION".equals(ci.getSegment()) || "CREDIT_LIMIT_BREACHED".equals(ci.getSegment())) {
                String draft = "Dear " + ci.getCustomerName() + ", this is a gentle reminder from ThreadPilot regarding your pending balance of ₹" +
                        ci.getOutstandingBalance() + ". Please let us know when we can expect settlement or reply with your payment receipt. Thank you!";
                items.add(ActionItem.builder()
                        .priority("HIGH")
                        .category("COLLECTION")
                        .title("Collect Overdue: " + ci.getCustomerName())
                        .reason(String.format("Overdue: ₹%s (Total sales: ₹%s). %s", ci.getOutstandingBalance(), ci.getTotalSales(), ci.getRecommendation()))
                        .entityType("CUSTOMER")
                        .entityId(ci.getCustomerId())
                        .actionUrl("/customers")
                        .financialImpact(ci.getOutstandingBalance())
                        .suggestedDraftMessage(draft)
                        .build());
            } else if ("REACTIVATION_OPPORTUNITY".equals(ci.getSegment())) {
                String draft = "Dear " + ci.getCustomerName() + ", greetings from ThreadPilot. We noticed it has been " + ci.getDaysSinceLastOrder() +
                        " days since your last order. Our new seasonal textile collections and yarn blends are now in stock. Would you like us to share our latest catalog?";
                items.add(ActionItem.builder()
                        .priority("MEDIUM")
                        .category("SALES")
                        .title("Reactivate: " + ci.getCustomerName())
                        .reason(String.format("Zero debt. %d days since last order (usual interval: %d days). %s",
                                ci.getDaysSinceLastOrder(), ci.getAvgOrderIntervalDays() != null ? ci.getAvgOrderIntervalDays() : 30, ci.getRecommendation()))
                        .entityType("CUSTOMER")
                        .entityId(ci.getCustomerId())
                        .actionUrl("/customers")
                        .financialImpact(ci.getTotalSales())
                        .suggestedDraftMessage(draft)
                        .build());
            }
        }

        // 3. Supplier invoices due soon
        List<SupplierInvoice> dueSoon = invoiceRepository.findDueSoon(orgId, today, today.plusDays(7));
        for (SupplierInvoice inv : dueSoon) {
            items.add(ActionItem.builder()
                    .priority("MEDIUM")
                    .category("PAYABLE")
                    .title("Pay Supplier: " + inv.getSupplier().getName())
                    .reason(String.format("Invoice %s due on %s. Outstanding: ₹%s", inv.getInvoiceNumber(), inv.getDueDate(), inv.getOutstandingAmount()))
                    .entityType("SUPPLIER_INVOICE")
                    .entityId(inv.getId())
                    .actionUrl("/invoices")
                    .financialImpact(inv.getOutstandingAmount())
                    .build());
        }

        return items;
    }

    @Transactional(readOnly = true)
    public List<TextileProductIntelligence> getTextileProductIntelligence() {
        UUID orgId = TenantContext.requireTenantId();
        LocalDate today = LocalDate.now();
        LocalDate thirtyDaysAgo = today.minusDays(30);
        Instant fourteenDaysAgo = Instant.now().minus(14, java.time.temporal.ChronoUnit.DAYS);

        List<Product> products = productRepository.findActiveByOrganizationId(orgId, Pageable.unpaged()).getContent();
        List<Inventory> inventories = inventoryRepository.findByOrganizationId(orgId, Pageable.unpaged()).getContent();
        Map<UUID, Inventory> inventoryMap = inventories.stream()
                .filter(i -> i.getProduct() != null)
                .collect(Collectors.toMap(i -> i.getProduct().getId(), Function.identity(), (a, b) -> a));

        List<ProductSalesSummary> salesSummaries = saleRepository.getTopSellingProducts(orgId, thirtyDaysAgo, today, Pageable.unpaged());
        Map<UUID, Long> salesQtyMap = salesSummaries.stream()
                .filter(s -> s.getProductId() != null)
                .collect(Collectors.toMap(ProductSalesSummary::getProductId, s -> s.getTotalQuantity() != null ? s.getTotalQuantity() : 0L, (a, b) -> a + b));

        List<TextileProductIntelligence> result = new ArrayList<>();

        for (Product p : products) {
            Inventory inv = inventoryMap.get(p.getId());
            int currentStock = inv != null && inv.getAvailableQuantity() != null ? inv.getAvailableQuantity() : 0;
            int unitsSold30Days = salesQtyMap.getOrDefault(p.getId(), 0L).intValue();
            BigDecimal dailyVelocity = BigDecimal.valueOf(unitsSold30Days).divide(BigDecimal.valueOf(30), 2, RoundingMode.HALF_UP);

            Integer daysOfStock = null;
            if (dailyVelocity.compareTo(BigDecimal.ZERO) > 0) {
                daysOfStock = (int) (currentStock / dailyVelocity.doubleValue());
            }

            boolean isNewlyLaunched = p.getCreatedAt() != null && p.getCreatedAt().isAfter(fourteenDaysAgo);
            String dataQualityStatus;
            String demandTrend;
            String recommendation;

            if (isNewlyLaunched) {
                dataQualityStatus = "PRELIMINARY_DATA";
                demandTrend = "NEW_PRODUCT_COLLECTING_DATA";
                recommendation = "Newly introduced yarn/product (<14 days old). Baseline velocity is being established. Safe from deadstock classification.";
            } else {
                dataQualityStatus = "RELIABLE";
                if (currentStock == 0 && unitsSold30Days > 0) {
                    demandTrend = "OUT_OF_STOCK_DEMAND_LOST";
                    recommendation = "High-demand product is completely out of stock. Immediate production/purchase order required to avoid lost revenue.";
                } else if (dailyVelocity.compareTo(BigDecimal.ZERO) > 0 && daysOfStock != null && daysOfStock <= 7) {
                    demandTrend = "FAST_MOVING_CRITICAL_STOCK";
                    recommendation = "Fast-moving line with less than 7 days of stock (" + daysOfStock + " days left). Initiate yarn batch replenishment immediately.";
                } else if (dailyVelocity.compareTo(BigDecimal.ZERO) > 0 && daysOfStock != null && daysOfStock <= 15) {
                    demandTrend = "FAST_MOVING_REPLENISH_SOON";
                    recommendation = "Healthy sales velocity with ~" + daysOfStock + " days of stock remaining. Plan production run.";
                } else if (unitsSold30Days == 0 && currentStock > 0) {
                    demandTrend = "SLOW_MOVING_DEADSTOCK";
                    recommendation = "Zero units sold in the last 30 days with warehouse stock held. Consider discount pricing or promotional bundling.";
                } else {
                    demandTrend = "STEADY_PERFORMER";
                    recommendation = "Consistent performer with balanced stock-to-demand ratio.";
                }
            }

            result.add(TextileProductIntelligence.builder()
                    .productId(p.getId())
                    .sku(p.getSku())
                    .productName(p.getName())
                    .category(p.getCategory())
                    .currentStock(currentStock)
                    .unitsSold30Days(unitsSold30Days)
                    .dailyVelocity(dailyVelocity)
                    .daysOfStock(daysOfStock)
                    .demandTrend(demandTrend)
                    .dataQualityStatus(dataQualityStatus)
                    .recommendation(recommendation)
                    .reorderQuantity(p.getReorderQuantity())
                    .build());
        }

        return result;
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
        if (totalProducts == null || totalProducts == 0) return null;

        Long lowStockCount = inventoryRepository.countLowStock(orgId, 10);
        long lowCount = lowStockCount != null ? lowStockCount : 0L;

        BigDecimal health = BigDecimal.valueOf(100).subtract(
                BigDecimal.valueOf(lowCount).multiply(BigDecimal.valueOf(100)).divide(BigDecimal.valueOf(totalProducts), 4, RoundingMode.HALF_UP)
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

        boolean hasCurrent = currentMonthSales != null && currentMonthSales.compareTo(BigDecimal.ZERO) > 0;
        boolean hasPrev = prevMonthSales != null && prevMonthSales.compareTo(BigDecimal.ZERO) > 0;

        if (!hasCurrent && !hasPrev) {
            return null;
        }

        if (hasPrev) {
            BigDecimal current = currentMonthSales != null ? currentMonthSales : BigDecimal.ZERO;
            BigDecimal growthRate = current.subtract(prevMonthSales)
                    .divide(prevMonthSales, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100));

            BigDecimal score = BigDecimal.valueOf(50).add(growthRate);
            return score.max(BigDecimal.ZERO).min(BigDecimal.valueOf(100));
        }

        return BigDecimal.valueOf(80);
    }

    private BigDecimal calculateCollectionsHealth(UUID orgId) {
        BigDecimal totalReceivables = getTotalReceivables(orgId);
        BigDecimal totalPayables = getTotalPayables(orgId);

        boolean hasReceivables = totalReceivables != null && totalReceivables.compareTo(BigDecimal.ZERO) > 0;
        boolean hasPayables = totalPayables != null && totalPayables.compareTo(BigDecimal.ZERO) > 0;

        if (!hasReceivables && !hasPayables) {
            return null;
        }

        if (hasReceivables && !hasPayables) {
            return BigDecimal.valueOf(100);
        }

        if (!hasReceivables && hasPayables) {
            return BigDecimal.ZERO;
        }

        BigDecimal ratio = totalPayables.divide(totalReceivables, 4, RoundingMode.HALF_UP);
        BigDecimal score = BigDecimal.valueOf(100).subtract(ratio.multiply(BigDecimal.valueOf(50)));
        return score.max(BigDecimal.ZERO).min(BigDecimal.valueOf(100));
    }

    private BigDecimal calculateProfitabilityHealth(UUID orgId) {
        LocalDate startOfMonth = LocalDate.now().withDayOfMonth(1);
        LocalDate today = LocalDate.now();

        BigDecimal revenue = saleRepository.getTotalRevenueByDateRange(orgId, startOfMonth, today);
        if (revenue == null || revenue.compareTo(BigDecimal.ZERO) == 0) {
            return null;
        }

        BigDecimal grossProfit = saleRepository.getTotalGrossProfitByDateRange(orgId, startOfMonth, today);
        BigDecimal profit = grossProfit != null ? grossProfit : BigDecimal.ZERO;

        BigDecimal margin = profit.divide(revenue, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100));
        BigDecimal score = margin.multiply(BigDecimal.valueOf(2.5));
        return score.max(BigDecimal.ZERO).min(BigDecimal.valueOf(100));
    }

    private BigDecimal calculateSlowMovingHealth(UUID orgId) {
        Long totalProducts = productRepository.countActiveByOrganizationId(orgId);
        Long slowMovingCount = productRepository.countSlowMoving(orgId, LocalDate.now().minusDays(90));

        if (totalProducts == null || totalProducts == 0) return null;

        BigDecimal health = BigDecimal.valueOf(100).subtract(
                BigDecimal.valueOf(slowMovingCount).multiply(BigDecimal.valueOf(100)).divide(BigDecimal.valueOf(totalProducts), 4, RoundingMode.HALF_UP)
        );
        return health.max(BigDecimal.ZERO).min(BigDecimal.valueOf(100));
    }

    @lombok.Builder
    @lombok.Data
    public static class BusinessHealthScore {
        private Integer overallScore;
        private Integer inventoryHealth;
        private Integer salesHealth;
        private Integer collectionsHealth;
        private Integer profitabilityHealth;
        private Integer slowMovingHealth;
        private Boolean hasSufficientData;
        private String statusMessage;
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

    @lombok.Builder
    @lombok.Data
    public static class ReceivablesAging {
        private BigDecimal current0To30;
        private BigDecimal overdue31To60;
        private BigDecimal overdue61To90;
        private BigDecimal overdue90Plus;
        private BigDecimal totalReceivables;
        private List<CustomerAgingSummary> customerSummaries;
    }

    @lombok.Builder
    @lombok.Data
    public static class CustomerAgingSummary {
        private UUID customerId;
        private String customerName;
        private BigDecimal outstanding;
        private BigDecimal creditLimit;
        private int daysOverdue;
        private LocalDate earliestDueDate;
    }

    @lombok.Builder
    @lombok.Data
    public static class CustomerIntelligence {
        private UUID customerId;
        private String customerName;
        private String businessName;
        private BigDecimal totalSales;
        private BigDecimal outstandingBalance;
        private BigDecimal creditLimit;
        private int orderCount;
        private Integer avgOrderIntervalDays;
        private Integer daysSinceLastOrder;
        private Boolean hasAdequateHistory;
        private Boolean cycleInterrupted;
        private String segment;
        private String recommendation;
    }

    @lombok.Builder
    @lombok.Data
    public static class ActionItem {
        private String priority;
        private String category;
        private String title;
        private String reason;
        private String entityType;
        private UUID entityId;
        private String actionUrl;
        private BigDecimal financialImpact;
        private String suggestedDraftMessage;
    }

    @lombok.Builder
    @lombok.Data
    public static class TextileProductIntelligence {
        private UUID productId;
        private String sku;
        private String productName;
        private String category;
        private Integer currentStock;
        private Integer unitsSold30Days;
        private BigDecimal dailyVelocity;
        private Integer daysOfStock;
        private String demandTrend;
        private String dataQualityStatus;
        private String recommendation;
        private Integer reorderQuantity;
    }
}
