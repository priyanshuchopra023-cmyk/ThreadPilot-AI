package com.threadpilot.financial;

import com.threadpilot.customer.Customer;
import com.threadpilot.invoice.SupplierInvoice;
import com.threadpilot.invoice.SupplierInvoiceItem;
import com.threadpilot.order.CustomerOrder;
import com.threadpilot.order.CustomerOrderItem;
import com.threadpilot.sale.SaleItem;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

public class FinancialIntegrityTest {

    @Test
    @DisplayName("CustomerOrderItem: computes base, discount, tax, and line total with half-up rounding")
    void testCustomerOrderItemCalculations() {
        // Given: 10 items @ 199.99 with 10% discount and 18% GST
        CustomerOrderItem item = CustomerOrderItem.builder()
                .quantity(10)
                .unitPrice(new BigDecimal("199.99"))
                .discountRate(new BigDecimal("10.00"))
                .taxRate(new BigDecimal("18.00"))
                .build();

        // Base amount = 10 * 199.99 = 1999.90
        assertThat(item.getBaseAmount()).isEqualByComparingTo("1999.90");

        // Discount amount = 10% of 1999.90 = 199.99
        assertThat(item.getDiscountAmount()).isEqualByComparingTo("199.99");

        // Taxable = 1999.90 - 199.99 = 1799.91
        // Tax = 18% of 1799.91 = 323.9838 -> rounded half-up to 323.98
        assertThat(item.getTaxAmount()).isEqualByComparingTo("323.98");

        item.calculateLineTotal();
        // Line total = 1799.91 + 323.98 = 2123.89
        assertThat(item.getLineTotal()).isEqualByComparingTo("2123.89");
    }

    @Test
    @DisplayName("CustomerOrder: recalculate totals matches sum of items without double counting")
    void testCustomerOrderTotalsConsistency() {
        CustomerOrderItem item1 = CustomerOrderItem.builder()
                .quantity(2)
                .unitPrice(new BigDecimal("500.00"))
                .discountRate(new BigDecimal("5.00"))
                .taxRate(new BigDecimal("12.00"))
                .build();
        item1.calculateLineTotal();
        // Base = 1000.00, Discount = 50.00, Taxable = 950.00, Tax = 114.00, Line Total = 1064.00

        CustomerOrderItem item2 = CustomerOrderItem.builder()
                .quantity(1)
                .unitPrice(new BigDecimal("2000.00"))
                .discountRate(BigDecimal.ZERO)
                .taxRate(new BigDecimal("5.00"))
                .build();
        item2.calculateLineTotal();
        // Base = 2000.00, Discount = 0, Taxable = 2000.00, Tax = 100.00, Line Total = 2100.00

        CustomerOrder order = CustomerOrder.builder()
                .items(Set.of(item1, item2))
                .build();

        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal taxTotal = BigDecimal.ZERO;
        BigDecimal discountTotal = BigDecimal.ZERO;
        BigDecimal totalAmount = BigDecimal.ZERO;

        for (CustomerOrderItem item : order.getItems()) {
            subtotal = subtotal.add(item.getBaseAmount());
            discountTotal = discountTotal.add(item.getDiscountAmount());
            taxTotal = taxTotal.add(item.getTaxAmount());
            totalAmount = totalAmount.add(item.getLineTotal());
        }

        order.setSubtotal(subtotal);
        order.setDiscountAmount(discountTotal);
        order.setTaxAmount(taxTotal);
        order.setTotalAmount(totalAmount);
        order.setOutstandingAmount(totalAmount);

        assertThat(order.getSubtotal()).isEqualByComparingTo("3000.00");
        assertThat(order.getDiscountAmount()).isEqualByComparingTo("50.00");
        assertThat(order.getTaxAmount()).isEqualByComparingTo("214.00");
        // Total Amount: 1064.00 + 2100.00 = 3164.00
        assertThat(order.getTotalAmount()).isEqualByComparingTo("3164.00");
        // Subtotal (3000) - Discount (50) + Tax (214) = 3164.00
        assertThat(order.getSubtotal().subtract(order.getDiscountAmount()).add(order.getTaxAmount()))
                .isEqualByComparingTo(order.getTotalAmount());
    }

    @Test
    @DisplayName("SupplierInvoice: recalculate totals matches line items")
    void testSupplierInvoiceTotals() {
        SupplierInvoiceItem item = SupplierInvoiceItem.builder()
                .quantity(5)
                .unitPrice(new BigDecimal("150.00"))
                .discountRate(new BigDecimal("10.00"))
                .taxRate(new BigDecimal("18.00"))
                .build();
        item.calculateLineTotal();

        // Base = 750.00, Disc = 75.00, Taxable = 675.00, Tax = 121.50, Line Total = 796.50
        assertThat(item.getBaseAmount()).isEqualByComparingTo("750.00");
        assertThat(item.getDiscountAmount()).isEqualByComparingTo("75.00");
        assertThat(item.getTaxAmount()).isEqualByComparingTo("121.50");
        assertThat(item.getLineTotal()).isEqualByComparingTo("796.50");

        SupplierInvoice invoice = SupplierInvoice.builder()
                .items(new HashSet<>(List.of(item)))
                .subtotal(item.getBaseAmount())
                .discountAmount(item.getDiscountAmount())
                .taxAmount(item.getTaxAmount())
                .totalAmount(item.getLineTotal())
                .paidAmount(BigDecimal.ZERO)
                .outstandingAmount(item.getLineTotal())
                .build();

        assertThat(invoice.getTotalAmount()).isEqualByComparingTo("796.50");
        assertThat(invoice.getOutstandingAmount()).isEqualByComparingTo("796.50");

        // Simulate partial payment of 300.00
        BigDecimal payment = new BigDecimal("300.00");
        invoice.setPaidAmount(invoice.getPaidAmount().add(payment));
        invoice.setOutstandingAmount(invoice.getTotalAmount().subtract(invoice.getPaidAmount()));

        assertThat(invoice.getPaidAmount()).isEqualByComparingTo("300.00");
        assertThat(invoice.getOutstandingAmount()).isEqualByComparingTo("496.50");
    }

    @Test
    @DisplayName("SaleItem: gross profit and margin percent calculations")
    void testSaleItemProfitCalculations() {
        SaleItem saleItem = SaleItem.builder()
                .quantity(10)
                .unitPrice(new BigDecimal("100.00"))
                .unitCost(new BigDecimal("60.00"))
                .discountRate(BigDecimal.ZERO)
                .taxRate(new BigDecimal("10.00"))
                .build();
        saleItem.calculateAmounts();

        // Line total: 10 * 100 = 1000 + 10% tax = 1100.00
        // Cost: 10 * 60 = 600.00
        assertThat(saleItem.getLineTotal()).isEqualByComparingTo("1100.00");
        assertThat(saleItem.getCostAmount()).isEqualByComparingTo("600.00");
        // Gross Profit = 1100 - 600 = 500.00
        assertThat(saleItem.getGrossProfit()).isEqualByComparingTo("500.00");
        // Gross margin % = (500 / 1100) * 100 = 45.45%
        assertThat(saleItem.getGrossMarginPercent()).isEqualByComparingTo("45.45");
    }

    @Test
    @DisplayName("Customer Credit Limit: validates limit enforcement rule")
    void testCustomerCreditLimitRule() {
        Customer customer = Customer.builder()
                .creditLimit(new BigDecimal("10000.00"))
                .outstandingAmount(new BigDecimal("8500.00"))
                .build();

        BigDecimal incomingOrderTotal = new BigDecimal("2000.00");
        BigDecimal prospectiveTotal = customer.getOutstandingAmount().add(incomingOrderTotal);

        // 8500 + 2000 = 10500 > 10000 credit limit -> Must breach
        boolean breachesLimit = prospectiveTotal.compareTo(customer.getCreditLimit()) > 0;
        assertThat(breachesLimit).isTrue();

        // Safe order within remaining credit (e.g. 1500)
        BigDecimal safeOrderTotal = new BigDecimal("1500.00");
        boolean safeProspective = customer.getOutstandingAmount().add(safeOrderTotal).compareTo(customer.getCreditLimit()) <= 0;
        assertThat(safeProspective).isTrue();
    }
}
