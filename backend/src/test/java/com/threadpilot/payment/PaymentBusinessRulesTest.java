package com.threadpilot.payment;

import com.threadpilot.common.exception.BusinessException;
import com.threadpilot.customer.Customer;
import com.threadpilot.invoice.SupplierInvoice;
import com.threadpilot.order.CustomerOrder;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

public class PaymentBusinessRulesTest {

    @Test
    @DisplayName("Payment Validation: Rejects zero or negative payment amount")
    void testNonPositiveAmountRejected() {
        BigDecimal zeroAmount = BigDecimal.ZERO;
        BigDecimal negativeAmount = new BigDecimal("-150.00");

        assertThatThrownBy(() -> validatePaymentAmount(zeroAmount))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Payment amount must be greater than zero");

        assertThatThrownBy(() -> validatePaymentAmount(negativeAmount))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Payment amount must be greater than zero");
    }

    @Test
    @DisplayName("Payment Validation: Rejects overpayment exceeding customer order outstanding balance")
    void testCustomerOrderOverpaymentRejected() {
        CustomerOrder order = CustomerOrder.builder()
                .outstandingAmount(new BigDecimal("1500.00"))
                .paidAmount(new BigDecimal("500.00"))
                .totalAmount(new BigDecimal("2000.00"))
                .build();

        BigDecimal excessiveAmount = new BigDecimal("1500.01");

        assertThatThrownBy(() -> validateOrderPayment(order, excessiveAmount))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("exceeds outstanding balance");
    }

    @Test
    @DisplayName("Payment Validation: Rejects overpayment exceeding supplier invoice outstanding balance")
    void testSupplierInvoiceOverpaymentRejected() {
        SupplierInvoice invoice = SupplierInvoice.builder()
                .outstandingAmount(new BigDecimal("3200.00"))
                .paidAmount(new BigDecimal("800.00"))
                .totalAmount(new BigDecimal("4000.00"))
                .build();

        BigDecimal excessiveAmount = new BigDecimal("3500.00");

        assertThatThrownBy(() -> validateInvoicePayment(invoice, excessiveAmount))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("exceeds invoice outstanding balance");
    }

    @Test
    @DisplayName("Payment Ledger: Partial payment accurately updates customer and order balances")
    void testPartialPaymentBalanceUpdates() {
        Customer customer = Customer.builder()
                .outstandingAmount(new BigDecimal("5000.00"))
                .build();

        CustomerOrder order = CustomerOrder.builder()
                .outstandingAmount(new BigDecimal("2500.00"))
                .paidAmount(new BigDecimal("0.00"))
                .totalAmount(new BigDecimal("2500.00"))
                .build();

        BigDecimal paymentAmount = new BigDecimal("1000.00");

        // Apply payment
        order.setPaidAmount(order.getPaidAmount().add(paymentAmount));
        order.setOutstandingAmount(order.getTotalAmount().subtract(order.getPaidAmount()).max(BigDecimal.ZERO));
        customer.setOutstandingAmount(customer.getOutstandingAmount().subtract(paymentAmount).max(BigDecimal.ZERO));

        assertThat(order.getPaidAmount()).isEqualByComparingTo("1000.00");
        assertThat(order.getOutstandingAmount()).isEqualByComparingTo("1500.00");
        assertThat(customer.getOutstandingAmount()).isEqualByComparingTo("4000.00");

        // Simulate payment deletion / reversal
        order.setPaidAmount(order.getPaidAmount().subtract(paymentAmount).max(BigDecimal.ZERO));
        order.setOutstandingAmount(order.getTotalAmount().subtract(order.getPaidAmount()));
        customer.setOutstandingAmount(customer.getOutstandingAmount().add(paymentAmount));

        assertThat(order.getPaidAmount()).isEqualByComparingTo("0.00");
        assertThat(order.getOutstandingAmount()).isEqualByComparingTo("2500.00");
        assertThat(customer.getOutstandingAmount()).isEqualByComparingTo("5000.00");
    }

    private void validatePaymentAmount(BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException("INVALID_PAYMENT_AMOUNT", "Payment amount must be greater than zero");
        }
    }

    private void validateOrderPayment(CustomerOrder order, BigDecimal amount) {
        if (order.getOutstandingAmount() != null && amount.compareTo(order.getOutstandingAmount()) > 0) {
            throw new BusinessException("OVERPAYMENT_NOT_ALLOWED",
                    String.format("Payment amount %s exceeds outstanding balance %s", amount, order.getOutstandingAmount()));
        }
    }

    private void validateInvoicePayment(SupplierInvoice invoice, BigDecimal amount) {
        if (invoice.getOutstandingAmount() != null && amount.compareTo(invoice.getOutstandingAmount()) > 0) {
            throw new BusinessException("OVERPAYMENT_NOT_ALLOWED",
                    String.format("Payment amount %s exceeds invoice outstanding balance %s", amount, invoice.getOutstandingAmount()));
        }
    }
}
