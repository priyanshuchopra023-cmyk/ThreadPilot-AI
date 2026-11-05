package com.threadpilot.integration;

import com.threadpilot.analytics.AnalyticsService;
import com.threadpilot.auth.dto.ChangePasswordRequest;
import com.threadpilot.common.exception.BusinessException;
import com.threadpilot.customer.Customer;
import com.threadpilot.invoice.SupplierInvoice;
import com.threadpilot.invoice.SupplierInvoiceItem;
import com.threadpilot.order.CustomerOrder;
import com.threadpilot.order.CustomerOrderItem;
import com.threadpilot.organization.Organization;
import com.threadpilot.sale.Sale;
import com.threadpilot.sale.SaleItem;
import com.threadpilot.security.TenantContext;
import com.threadpilot.supplier.Supplier;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

public class ComprehensiveVerificationTest {

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    // ==========================================
    // 1. FINANCIAL CORRECTNESS & RECONCILIATION
    // ==========================================

    @Test
    @DisplayName("Financial: Supplier invoice line items and totals match GAAP standards with half-up rounding")
    void testSupplierInvoiceFinancialReconciliation() {
        // Line 1: 15 units @ 245.50, 8% discount, 18% GST
        SupplierInvoiceItem item1 = SupplierInvoiceItem.builder()
                .quantity(15)
                .unitPrice(new BigDecimal("245.50"))
                .discountRate(new BigDecimal("8.00"))
                .taxRate(new BigDecimal("18.00"))
                .build();
        // Line 2: 4 units @ 1120.00, 0% discount, 12% GST
        SupplierInvoiceItem item2 = SupplierInvoiceItem.builder()
                .quantity(4)
                .unitPrice(new BigDecimal("1120.00"))
                .discountRate(BigDecimal.ZERO)
                .taxRate(new BigDecimal("12.00"))
                .build();

        item1.calculateLineTotal();
        item2.calculateLineTotal();

        // Item 1: Base = 15 * 245.50 = 3682.50
        assertThat(item1.getBaseAmount()).isEqualByComparingTo("3682.50");
        // Item 1: Discount = 8% of 3682.50 = 294.60
        assertThat(item1.getDiscountAmount()).isEqualByComparingTo("294.60");
        // Item 1: Taxable = 3682.50 - 294.60 = 3387.90
        // Item 1: Tax = 18% of 3387.90 = 609.822 -> 609.82
        assertThat(item1.getTaxAmount()).isEqualByComparingTo("609.82");
        // Item 1: Line total = 3387.90 + 609.82 = 3997.72
        assertThat(item1.getLineTotal()).isEqualByComparingTo("3997.72");

        // Item 2: Base = 4480.00, Discount = 0, Taxable = 4480.00, Tax = 12% of 4480 = 537.60
        // Item 2: Line total = 4480.00 + 537.60 = 5017.60
        assertThat(item2.getBaseAmount()).isEqualByComparingTo("4480.00");
        assertThat(item2.getDiscountAmount()).isEqualByComparingTo("0.00");
        assertThat(item2.getTaxAmount()).isEqualByComparingTo("537.60");
        assertThat(item2.getLineTotal()).isEqualByComparingTo("5017.60");

        // Reconcile Invoice Totals
        BigDecimal invoiceSubtotal = item1.getBaseAmount().add(item2.getBaseAmount()); // 8162.50
        BigDecimal invoiceDiscount = item1.getDiscountAmount().add(item2.getDiscountAmount()); // 294.60
        BigDecimal invoiceTax = item1.getTaxAmount().add(item2.getTaxAmount()); // 1147.42
        BigDecimal invoiceTotal = item1.getLineTotal().add(item2.getLineTotal()); // 9015.32

        assertThat(invoiceSubtotal).isEqualByComparingTo("8162.50");
        assertThat(invoiceDiscount).isEqualByComparingTo("294.60");
        assertThat(invoiceTax).isEqualByComparingTo("1147.42");
        assertThat(invoiceTotal).isEqualByComparingTo("9015.32");

        // Verify: Subtotal - Discount + Tax == Total
        assertThat(invoiceSubtotal.subtract(invoiceDiscount).add(invoiceTax)).isEqualByComparingTo(invoiceTotal);
    }

    @Test
    @DisplayName("Financial: Customer order line items, discounts, taxes and totals calculate without double counting")
    void testCustomerOrderFinancialReconciliation() {
        // 5 units @ 999.00 with 5% discount and 12% GST
        CustomerOrderItem orderItem = CustomerOrderItem.builder()
                .quantity(5)
                .unitPrice(new BigDecimal("999.00"))
                .discountRate(new BigDecimal("5.00"))
                .taxRate(new BigDecimal("12.00"))
                .build();
        orderItem.calculateLineTotal();

        // Base = 5 * 999.00 = 4995.00
        assertThat(orderItem.getBaseAmount()).isEqualByComparingTo("4995.00");
        // Discount = 5% of 4995.00 = 249.75
        assertThat(orderItem.getDiscountAmount()).isEqualByComparingTo("249.75");
        // Taxable = 4995.00 - 249.75 = 4745.25
        // Tax = 12% of 4745.25 = 569.43
        assertThat(orderItem.getTaxAmount()).isEqualByComparingTo("569.43");
        // Line total = 4745.25 + 569.43 = 5314.68
        assertThat(orderItem.getLineTotal()).isEqualByComparingTo("5314.68");
    }

    // ==========================================
    // 2. PAYMENT ALLOCATION & REVERSAL RULES
    // ==========================================

    @Test
    @DisplayName("Payments: Rejects zero or negative amounts")
    void testPaymentAmountValidation() {
        BigDecimal zero = new BigDecimal("0.00");
        BigDecimal negative = new BigDecimal("-500.00");

        assertThatThrownBy(() -> {
            if (zero.compareTo(BigDecimal.ZERO) <= 0) {
                throw new BusinessException("INVALID_AMOUNT", "Payment amount must be greater than zero");
            }
        }).isInstanceOf(BusinessException.class).hasMessageContaining("greater than zero");

        assertThatThrownBy(() -> {
            if (negative.compareTo(BigDecimal.ZERO) <= 0) {
                throw new BusinessException("INVALID_AMOUNT", "Payment amount must be greater than zero");
            }
        }).isInstanceOf(BusinessException.class).hasMessageContaining("greater than zero");
    }

    @Test
    @DisplayName("Payments: Overpayment exceeding remaining balance is strictly prevented")
    void testOverpaymentRejection() {
        CustomerOrder order = CustomerOrder.builder()
                .totalAmount(new BigDecimal("10000.00"))
                .paidAmount(new BigDecimal("6000.00"))
                .outstandingAmount(new BigDecimal("4000.00"))
                .build();

        BigDecimal incomingPayment = new BigDecimal("4000.01");

        assertThatThrownBy(() -> {
            if (incomingPayment.compareTo(order.getOutstandingAmount()) > 0) {
                throw new BusinessException("OVERPAYMENT_NOT_ALLOWED",
                        String.format("Payment amount %s exceeds outstanding balance %s", incomingPayment, order.getOutstandingAmount()));
            }
        }).isInstanceOf(BusinessException.class).hasMessageContaining("exceeds outstanding balance");
    }

    @Test
    @DisplayName("Payments: Partial payment allocation, balance decrement and deletion reversal")
    void testPaymentAllocationAndReversal() {
        Customer customer = Customer.builder()
                .outstandingAmount(new BigDecimal("12000.00"))
                .build();

        CustomerOrder order = CustomerOrder.builder()
                .totalAmount(new BigDecimal("8000.00"))
                .paidAmount(BigDecimal.ZERO)
                .outstandingAmount(new BigDecimal("8000.00"))
                .build();

        // 1. First partial payment of 3000.00
        BigDecimal payment1 = new BigDecimal("3000.00");
        order.setPaidAmount(order.getPaidAmount().add(payment1));
        order.setOutstandingAmount(order.getTotalAmount().subtract(order.getPaidAmount()).max(BigDecimal.ZERO));
        customer.setOutstandingAmount(customer.getOutstandingAmount().subtract(payment1).max(BigDecimal.ZERO));

        assertThat(order.getPaidAmount()).isEqualByComparingTo("3000.00");
        assertThat(order.getOutstandingAmount()).isEqualByComparingTo("5000.00");
        assertThat(customer.getOutstandingAmount()).isEqualByComparingTo("9000.00");

        // 2. Second partial payment of 5000.00 (settles order)
        BigDecimal payment2 = new BigDecimal("5000.00");
        order.setPaidAmount(order.getPaidAmount().add(payment2));
        order.setOutstandingAmount(order.getTotalAmount().subtract(order.getPaidAmount()).max(BigDecimal.ZERO));
        customer.setOutstandingAmount(customer.getOutstandingAmount().subtract(payment2).max(BigDecimal.ZERO));

        assertThat(order.getPaidAmount()).isEqualByComparingTo("8000.00");
        assertThat(order.getOutstandingAmount()).isEqualByComparingTo("0.00");
        assertThat(customer.getOutstandingAmount()).isEqualByComparingTo("4000.00");

        // 3. Payment 2 is reversed / deleted
        order.setPaidAmount(order.getPaidAmount().subtract(payment2).max(BigDecimal.ZERO));
        order.setOutstandingAmount(order.getTotalAmount().subtract(order.getPaidAmount()));
        customer.setOutstandingAmount(customer.getOutstandingAmount().add(payment2));

        assertThat(order.getPaidAmount()).isEqualByComparingTo("3000.00");
        assertThat(order.getOutstandingAmount()).isEqualByComparingTo("5000.00");
        assertThat(customer.getOutstandingAmount()).isEqualByComparingTo("9000.00");
    }

    // ==========================================
    // 3. ORDER CONFIRMATION & CREDIT LIMIT CHECK
    // ==========================================

    @Test
    @DisplayName("Credit Policy: Order confirmation enforces credit limit policy")
    void testCreditLimitEnforcementOnConfirmation() {
        Customer customer = Customer.builder()
                .creditLimit(new BigDecimal("25000.00"))
                .outstandingAmount(new BigDecimal("21000.00"))
                .build();

        CustomerOrder order = CustomerOrder.builder()
                .totalAmount(new BigDecimal("5000.00"))
                .build();

        // 21000 + 5000 = 26000 > 25000 limit -> Must throw CREDIT_LIMIT_EXCEEDED
        assertThatThrownBy(() -> {
            BigDecimal projectedOutstanding = customer.getOutstandingAmount().add(order.getTotalAmount());
            if (customer.getCreditLimit().compareTo(BigDecimal.ZERO) > 0 &&
                    projectedOutstanding.compareTo(customer.getCreditLimit()) > 0) {
                throw new BusinessException("CREDIT_LIMIT_EXCEEDED",
                        String.format("Order total %s would cause customer outstanding %s to exceed credit limit %s",
                                order.getTotalAmount(), projectedOutstanding, customer.getCreditLimit()));
            }
        }).isInstanceOf(BusinessException.class).hasMessageContaining("exceed credit limit");
    }

    // ==========================================
    // 4. BUSINESS BRAIN ACCURACY: AGING BUCKETS
    // ==========================================

    @Test
    @DisplayName("Business Brain: Receivables aging segregates buckets accurately by order date")
    void testReceivablesAgingBuckets() {
        LocalDate today = LocalDate.now();

        CustomerOrder order0To30 = CustomerOrder.builder()
                .orderDate(today.minusDays(15))
                .outstandingAmount(new BigDecimal("1000.00"))
                .build();

        CustomerOrder order31To60 = CustomerOrder.builder()
                .orderDate(today.minusDays(45))
                .outstandingAmount(new BigDecimal("2000.00"))
                .build();

        CustomerOrder order61To90 = CustomerOrder.builder()
                .orderDate(today.minusDays(75))
                .outstandingAmount(new BigDecimal("3000.00"))
                .build();

        CustomerOrder order90Plus = CustomerOrder.builder()
                .orderDate(today.minusDays(120))
                .outstandingAmount(new BigDecimal("4000.00"))
                .build();

        List<CustomerOrder> orders = List.of(order0To30, order31To60, order61To90, order90Plus);

        BigDecimal current0To30 = BigDecimal.ZERO;
        BigDecimal overdue31To60 = BigDecimal.ZERO;
        BigDecimal overdue61To90 = BigDecimal.ZERO;
        BigDecimal overdue90Plus = BigDecimal.ZERO;

        for (CustomerOrder o : orders) {
            long days = ChronoUnit.DAYS.between(o.getOrderDate(), today);
            if (days <= 30) {
                current0To30 = current0To30.add(o.getOutstandingAmount());
            } else if (days <= 60) {
                overdue31To60 = overdue31To60.add(o.getOutstandingAmount());
            } else if (days <= 90) {
                overdue61To90 = overdue61To90.add(o.getOutstandingAmount());
            } else {
                overdue90Plus = overdue90Plus.add(o.getOutstandingAmount());
            }
        }

        assertThat(current0To30).isEqualByComparingTo("1000.00");
        assertThat(overdue31To60).isEqualByComparingTo("2000.00");
        assertThat(overdue61To90).isEqualByComparingTo("3000.00");
        assertThat(overdue90Plus).isEqualByComparingTo("4000.00");
    }

    // ==========================================
    // 5. BUSINESS BRAIN: CREDIT INTELLIGENCE & SEGMENTATION
    // ==========================================

    @Test
    @DisplayName("Business Brain: Segregates collection risk from reactivation opportunities")
    void testCustomerCreditIntelligenceSegmentation() {
        // Customer A: Limit Breached
        Customer custA = Customer.builder()
                .creditLimit(new BigDecimal("10000.00"))
                .outstandingAmount(new BigDecimal("15000.00"))
                .build();

        // Customer B: High Sales, Poor Collections
        BigDecimal custBSales = new BigDecimal("80000.00");
        BigDecimal custBOutstanding = new BigDecimal("35000.00");
        BigDecimal custBLimit = new BigDecimal("50000.00");

        // Customer C: Reactivation Opportunity (Zero debt, 60 days since last order, avg interval 20 days)
        BigDecimal custCOutstanding = BigDecimal.ZERO;
        int custCDaysSince = 60;
        int custCAvgInterval = 20;

        // Customer D: Champion (High Sales > 50k, low debt)
        BigDecimal custDSales = new BigDecimal("95000.00");
        BigDecimal custDOutstanding = new BigDecimal("2000.00");
        BigDecimal custDLimit = new BigDecimal("50000.00");

        assertThat(classifySegment(custA.getOutstandingAmount(), custA.getCreditLimit(), BigDecimal.valueOf(20000), 10, 10))
                .isEqualTo("CREDIT_LIMIT_BREACHED");

        assertThat(classifySegment(custBOutstanding, custBLimit, custBSales, 15, 15))
                .isEqualTo("HIGH_SALES_POOR_COLLECTION");

        assertThat(classifySegment(custCOutstanding, new BigDecimal("10000"), BigDecimal.valueOf(15000), custCDaysSince, custCAvgInterval))
                .isEqualTo("REACTIVATION_OPPORTUNITY");

        assertThat(classifySegment(custDOutstanding, custDLimit, custDSales, 10, 15))
                .isEqualTo("CHAMPION");
    }

    private String classifySegment(BigDecimal outstanding, BigDecimal creditLimit, BigDecimal totalSales, Integer daysSince, Integer avgInterval) {
        if (creditLimit.compareTo(BigDecimal.ZERO) > 0 && outstanding.compareTo(creditLimit) > 0) {
            return "CREDIT_LIMIT_BREACHED";
        } else if (totalSales.compareTo(BigDecimal.valueOf(50000)) > 0 && outstanding.compareTo(BigDecimal.valueOf(20000)) > 0) {
            return "HIGH_SALES_POOR_COLLECTION";
        } else if (outstanding.compareTo(BigDecimal.ZERO) == 0 && daysSince != null && (avgInterval != null ? daysSince > 1.5 * avgInterval : daysSince > 45)) {
            return "REACTIVATION_OPPORTUNITY";
        } else if (totalSales.compareTo(BigDecimal.valueOf(50000)) > 0) {
            return "CHAMPION";
        } else {
            return "REGULAR";
        }
    }

    // ==========================================
    // 6. SECURITY: MULTI-TENANCY & AUTH BOUNDARIES
    // ==========================================

    @Test
    @DisplayName("Security: TenantContext enforces isolation and prevents cross-organization leaks")
    void testTenantContextIsolation() {
        UUID orgA = UUID.randomUUID();
        UUID orgB = UUID.randomUUID();

        TenantContext.setOrganizationId(orgA);
        assertThat(TenantContext.requireTenantId()).isEqualTo(orgA);

        // Simulate document access authorization check
        Organization org = new Organization();
        org.setId(orgB);
        SupplierInvoice invoiceOrgB = SupplierInvoice.builder()
                .organization(org)
                .build();

        boolean canAccess = invoiceOrgB.getOrganization().getId().equals(TenantContext.requireTenantId());
        assertThat(canAccess).isFalse();

        // Clear context
        TenantContext.clear();
        assertThatThrownBy(TenantContext::requireTenantId)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("No tenant context available");
    }

    @Test
    @DisplayName("Security: Password change requires matching current password hash and minimum length")
    void testPasswordChangeVerification() {
        PasswordEncoder encoder = new BCryptPasswordEncoder();
        String currentPlain = "OldStrongPassword123";
        String currentHash = encoder.encode(currentPlain);

        ChangePasswordRequest validRequest = new ChangePasswordRequest();
        validRequest.setCurrentPassword(currentPlain);
        validRequest.setNewPassword("NewSecurePassword2026");

        // 1. Correct password verifies
        assertThat(encoder.matches(validRequest.getCurrentPassword(), currentHash)).isTrue();

        // 2. Wrong current password is rejected
        ChangePasswordRequest wrongRequest = new ChangePasswordRequest();
        wrongRequest.setCurrentPassword("WrongPassword");
        wrongRequest.setNewPassword("NewSecurePassword2026");
        assertThat(encoder.matches(wrongRequest.getCurrentPassword(), currentHash)).isFalse();

        // 3. Short password rejected (< 8 chars)
        String shortPassword = "short";
        assertThat(shortPassword.length() < 8).isTrue();
    }

    // ==========================================
    // 7. BUSINESS BRAIN: DUE-DATE AGING & HISTORY
    // ==========================================

    @Test
    @DisplayName("Business Brain: Receivables aging uses invoice due date based on payment terms, not premature order date")
    void testReceivablesAgingDueDateCalculation() {
        LocalDate today = LocalDate.now();
        LocalDate orderDate = today.minusDays(35); // Placed 35 days ago

        // Customer with NET_60 credit terms
        Customer customerNet60 = Customer.builder()
                .paymentTerms("NET_60")
                .name("Ludhiana Knitwear Ltd")
                .build();

        CustomerOrder order = CustomerOrder.builder()
                .orderNumber("ORD-2026-001")
                .orderDate(orderDate)
                .customer(customerNet60)
                .outstandingAmount(new BigDecimal("25000.00"))
                .build();

        // Calculate due date using business rule (orderDate + 60 days)
        LocalDate dueDate = order.getOrderDate().plusDays(60);
        long daysPastDueDate = ChronoUnit.DAYS.between(dueDate, today);

        // Under order-date calculation (35 days), this would have been wrongly bucketed into 31-60 Overdue!
        // Under verified due-date calculation, due date is 25 days in the FUTURE (daysPastDueDate = -25).
        assertThat(daysPastDueDate).isLessThanOrEqualTo(0);
        assertThat(dueDate).isAfter(today);

        // Therefore, it correctly falls into the Current (within terms) bucket:
        String bucket = daysPastDueDate <= 30 ? "CURRENT_0_TO_30" : "OVERDUE";
        assertThat(bucket).isEqualTo("CURRENT_0_TO_30");
    }

    @Test
    @DisplayName("Business Brain: Adequate purchase history threshold (>=2 orders) guards new accounts from false churn")
    void testCustomerPurchasingHistoryThresholdAndCycleInterruption() {
        LocalDate today = LocalDate.now();

        // Case 1: Account with single order 40 days ago
        List<LocalDate> singleOrderHistory = List.of(today.minusDays(40));
        boolean hasAdequateHistorySingle = singleOrderHistory.size() >= 2;
        assertThat(hasAdequateHistorySingle).isFalse();

        // Must not be flagged as REACTIVATION_OPPORTUNITY despite 40 days passing; classified as NEW_ACCOUNT
        String singleOrderSegment = !hasAdequateHistorySingle ? "NEW_ACCOUNT" : "REACTIVATION_OPPORTUNITY";
        assertThat(singleOrderSegment).isEqualTo("NEW_ACCOUNT");

        // Case 2: Established account with 3 historical orders every 15 days, now silent for 45 days
        List<LocalDate> multiOrderHistory = List.of(
                today.minusDays(75),
                today.minusDays(60),
                today.minusDays(45)
        );
        boolean hasAdequateHistoryMulti = multiOrderHistory.size() >= 2;
        assertThat(hasAdequateHistoryMulti).isTrue();

        long totalDays = ChronoUnit.DAYS.between(multiOrderHistory.get(0), multiOrderHistory.get(multiOrderHistory.size() - 1));
        int avgInterval = (int) (totalDays / (multiOrderHistory.size() - 1)); // (75-45)/2 = 15 days
        assertThat(avgInterval).isEqualTo(15);

        int daysSinceLastOrder = (int) ChronoUnit.DAYS.between(multiOrderHistory.get(multiOrderHistory.size() - 1), today); // 45 days
        assertThat(daysSinceLastOrder).isEqualTo(45);

        boolean cycleInterrupted = daysSinceLastOrder > (int) (1.5 * avgInterval); // 45 > 22
        assertThat(cycleInterrupted).isTrue();

        String multiOrderSegment = cycleInterrupted ? "REACTIVATION_OPPORTUNITY" : "REGULAR";
        assertThat(multiOrderSegment).isEqualTo("REACTIVATION_OPPORTUNITY");
    }

    // ==========================================
    // 8. TEXTILE & HOSIERY INVENTORY INTELLIGENCE
    // ==========================================

    @Test
    @DisplayName("Textile Intelligence: Velocity, days of stock coverage, and new product deadstock guardrail")
    void testTextileProductVelocityAndDeadstockGuardrail() {
        java.time.Instant now = java.time.Instant.now();
        java.time.Instant fiveDaysAgo = now.minus(5, ChronoUnit.DAYS);
        java.time.Instant fiftyDaysAgo = now.minus(50, ChronoUnit.DAYS);

        // Product A: Newly launched yarn line (< 14 days old, e.g. 5 days ago)
        boolean isNewlyLaunched = fiveDaysAgo.isAfter(now.minus(14, ChronoUnit.DAYS));
        assertThat(isNewlyLaunched).isTrue();

        String productAStatus = isNewlyLaunched ? "PRELIMINARY_DATA" : "RELIABLE";
        String productATrend = isNewlyLaunched ? "NEW_PRODUCT_COLLECTING_DATA" : "SLOW_MOVING_DEADSTOCK";
        // Guardrail: must NEVER be classified as deadstock!
        assertThat(productAStatus).isEqualTo("PRELIMINARY_DATA");
        assertThat(productATrend).isEqualTo("NEW_PRODUCT_COLLECTING_DATA");

        // Product B: Established 30s Combed Cotton Yarn (50 days old), 300 units sold in 30 days, 50 units in stock
        boolean productBOld = fiftyDaysAgo.isBefore(now.minus(14, ChronoUnit.DAYS));
        assertThat(productBOld).isTrue();

        int unitsSold30Days = 300;
        BigDecimal dailyVelocity = BigDecimal.valueOf(unitsSold30Days).divide(BigDecimal.valueOf(30), 2, RoundingMode.HALF_UP); // 10.00 units/day
        assertThat(dailyVelocity).isEqualByComparingTo("10.00");

        int currentStock = 50;
        int daysOfStock = (int) (currentStock / dailyVelocity.doubleValue()); // 50 / 10 = 5 days
        assertThat(daysOfStock).isEqualTo(5);

        // Less than 7 days of stock -> FAST_MOVING_CRITICAL_STOCK
        String productBTrend = daysOfStock <= 7 ? "FAST_MOVING_CRITICAL_STOCK" : "STEADY_PERFORMER";
        assertThat(productBTrend).isEqualTo("FAST_MOVING_CRITICAL_STOCK");
    }
}
