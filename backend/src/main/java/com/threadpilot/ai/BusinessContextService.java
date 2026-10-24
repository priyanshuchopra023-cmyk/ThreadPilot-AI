package com.threadpilot.ai;

import com.threadpilot.analytics.AnalyticsService;
import com.threadpilot.customer.Customer;
import com.threadpilot.customer.CustomerRepository;
import com.threadpilot.event.BusinessEvent;
import com.threadpilot.event.BusinessEventRepository;
import com.threadpilot.inventory.Inventory;
import com.threadpilot.inventory.InventoryRepository;
import com.threadpilot.inventory.MovementType;
import com.threadpilot.inventory.StockMovementRepository;
import com.threadpilot.organization.Organization;
import com.threadpilot.order.CustomerOrder;
import com.threadpilot.order.CustomerOrderRepository;
import com.threadpilot.payment.PaymentRepository;
import com.threadpilot.product.Product;
import com.threadpilot.product.ProductRepository;
import com.threadpilot.sale.SaleRepository;
import com.threadpilot.security.TenantContext;
import com.threadpilot.supplier.Supplier;
import com.threadpilot.supplier.SupplierRepository;
import com.threadpilot.invoice.SupplierInvoice;
import com.threadpilot.invoice.SupplierInvoiceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class BusinessContextService {

    private final ProductRepository productRepository;
    private final InventoryRepository inventoryRepository;
    private final StockMovementRepository stockMovementRepository;
    private final SupplierRepository supplierRepository;
    private final CustomerRepository customerRepository;
    private final SaleRepository saleRepository;
    private final PaymentRepository paymentRepository;
    private final BusinessEventRepository businessEventRepository;
    private final AnalyticsService analyticsService;
    private final CustomerOrderRepository customerOrderRepository;
    private final SupplierInvoiceRepository supplierInvoiceRepository;

    @Transactional(readOnly = true)
    public BusinessContext getBusinessContext() {
        UUID orgId = TenantContext.requireTenantId();

        return BusinessContext.builder()
                .organizationId(orgId)
                .lowStockProducts(getLowStockProducts())
                .outOfStockProducts(getOutOfStockProducts())
                .topCustomersByOutstanding(getTopCustomersByOutstanding(10))
                .topSuppliersByOutstanding(getTopSuppliersByOutstanding(10))
                .recentSales(getRecentSales(10))
                .recentPayments(getRecentPayments(10))
                .totalInventoryValue(getTotalInventoryValue())
                .totalReceivables(getTotalReceivables())
                .totalPayables(getTotalPayables())
                .businessHealthScore(analyticsService.getBusinessHealthScore())
                .slowMovingProducts(getSlowMovingProducts(10))
                .recentEvents(getRecentEvents(20))
                .build();
    }

    @Transactional(readOnly = true)
    public CustomerContext getCustomerContext(UUID customerId) {
        UUID orgId = TenantContext.requireTenantId();

        Customer customer = customerRepository.findById(customerId)
                .filter(c -> c.getOrganization().getId().equals(orgId))
                .orElse(null);

        if (customer == null) {
            return null;
        }

        return CustomerContext.builder()
                .customer(customer)
                .recentOrders(getCustomerRecentOrders(customerId, 10))
                .recentPayments(getCustomerRecentPayments(customerId, 10))
                .totalOutstanding(customer.getOutstandingAmount())
                .creditLimit(customer.getCreditLimit())
                .paymentHistory(getCustomerPaymentHistory(customerId))
                .build();
    }

    @Transactional(readOnly = true)
    public SupplierContext getSupplierContext(UUID supplierId) {
        UUID orgId = TenantContext.requireTenantId();

        Supplier supplier = supplierRepository.findById(supplierId)
                .filter(s -> s.getOrganization().getId().equals(orgId))
                .orElse(null);

        if (supplier == null) {
            return null;
        }

        return SupplierContext.builder()
                .supplier(supplier)
                .recentInvoices(getSupplierRecentInvoices(supplierId, 10))
                .recentPayments(getSupplierRecentPayments(supplierId, 10))
                .totalOutstanding(supplier.getOutstandingAmount())
                .paymentHistory(getSupplierPaymentHistory(supplierId))
                .build();
    }

    @Transactional(readOnly = true)
    public ProductContext getProductContext(UUID productId) {
        UUID orgId = TenantContext.requireTenantId();

        Product product = productRepository.findById(productId)
                .filter(p -> p.getOrganization().getId().equals(orgId))
                .orElse(null);

        if (product == null) {
            return null;
        }

        Inventory inventory = inventoryRepository.findByProductIdAndOrganizationId(productId, orgId).orElse(null);

        return ProductContext.builder()
                .product(product)
                .inventory(inventory)
                .recentSales(getProductRecentSales(productId, 10))
                .recentMovements(getProductRecentMovements(productId, 20))
                .salesVelocity(calculateSalesVelocity(productId))
                .daysOfStockRemaining(calculateDaysOfStock(productId))
                .build();
    }

    private List<Inventory> getLowStockProducts() {
        UUID orgId = TenantContext.requireTenantId();
        return inventoryRepository.findLowStock(orgId, 10);
    }

    private List<Inventory> getOutOfStockProducts() {
        UUID orgId = TenantContext.requireTenantId();
        return inventoryRepository.findOutOfStock(orgId);
    }

    private List<Customer> getTopCustomersByOutstanding(int limit) {
        UUID orgId = TenantContext.requireTenantId();
        return customerRepository.findWithOutstanding(orgId).stream().limit(limit).toList();
    }

    private List<Supplier> getTopSuppliersByOutstanding(int limit) {
        UUID orgId = TenantContext.requireTenantId();
        return supplierRepository.findWithOutstanding(orgId).stream().limit(limit).toList();
    }

    private List<com.threadpilot.sale.Sale> getRecentSales(int limit) {
        UUID orgId = TenantContext.requireTenantId();
        return saleRepository.findByOrganizationId(orgId, org.springframework.data.domain.PageRequest.of(0, limit)).getContent();
    }

    private List<com.threadpilot.payment.Payment> getRecentPayments(int limit) {
        UUID orgId = TenantContext.requireTenantId();
        return paymentRepository.findByOrganizationId(orgId, org.springframework.data.domain.PageRequest.of(0, limit)).getContent();
    }

    private BigDecimal getTotalInventoryValue() {
        UUID orgId = TenantContext.requireTenantId();
        return inventoryRepository.getTotalInventoryValue(orgId);
    }

private BigDecimal getTotalReceivables() {
        UUID orgId = TenantContext.requireTenantId();
        return customerRepository.getTotalOutstanding(orgId);
    }

    private BigDecimal getTotalPayables() {
        UUID orgId = TenantContext.requireTenantId();
        return supplierRepository.getTotalOutstanding(orgId);
    }

private List<Inventory> getSlowMovingProducts(int limit) {
        UUID orgId = TenantContext.requireTenantId();
        return productRepository.findSlowMoving(orgId, LocalDate.now().minusDays(90), org.springframework.data.domain.PageRequest.of(0, limit))
                .stream()
                .map(p -> inventoryRepository.findByProductIdAndOrganizationId(p.getId(), orgId).orElse(null))
                .filter(java.util.Objects::nonNull)
                .toList();
    }

    private List<BusinessEvent> getRecentEvents(int limit) {
        UUID orgId = TenantContext.requireTenantId();
        return businessEventRepository.findByOrganizationId(orgId, org.springframework.data.domain.PageRequest.of(0, limit)).getContent();
    }

private List<com.threadpilot.order.CustomerOrder> getCustomerRecentOrders(UUID customerId, int limit) {
        UUID orgId = TenantContext.requireTenantId();
        return customerOrderRepository.findByCustomerId(customerId, orgId, org.springframework.data.domain.PageRequest.of(0, limit)).getContent();
    }

    private List<com.threadpilot.payment.Payment> getCustomerRecentPayments(UUID customerId, int limit) {
        UUID orgId = TenantContext.requireTenantId();
        return paymentRepository.findByCustomerId(customerId, orgId, org.springframework.data.domain.PageRequest.of(0, limit)).getContent();
    }

    private List<com.threadpilot.payment.Payment> getSupplierRecentPayments(UUID supplierId, int limit) {
        UUID orgId = TenantContext.requireTenantId();
        return paymentRepository.findBySupplierId(supplierId, orgId, org.springframework.data.domain.PageRequest.of(0, limit)).getContent();
    }

    private List<com.threadpilot.invoice.SupplierInvoice> getSupplierRecentInvoices(UUID supplierId, int limit) {
        UUID orgId = TenantContext.requireTenantId();
        return supplierInvoiceRepository.findBySupplierId(supplierId, orgId, org.springframework.data.domain.PageRequest.of(0, limit)).getContent();
    }

    private List<com.threadpilot.sale.Sale> getProductRecentSales(UUID productId, int limit) {
        UUID orgId = TenantContext.requireTenantId();
        return saleRepository.findByOrganizationId(orgId, org.springframework.data.domain.PageRequest.of(0, limit)).getContent().stream()
                .filter(s -> s.getItems().stream().anyMatch(i -> i.getProduct() != null && i.getProduct().getId().equals(productId)))
                .toList();
    }

    private List<com.threadpilot.inventory.StockMovement> getProductRecentMovements(UUID productId, int limit) {
        UUID orgId = TenantContext.requireTenantId();
        return stockMovementRepository.findByProductId(productId, orgId, org.springframework.data.domain.PageRequest.of(0, limit)).getContent();
    }

    private String getCustomerPaymentHistory(UUID customerId) {
        List<com.threadpilot.payment.Payment> payments = getCustomerRecentPayments(customerId, 20);
        return payments.stream()
                .map(p -> String.format("%s: %s (%s)", p.getPaymentDate(), p.getAmount(), p.getPaymentMethod()))
                .collect(Collectors.joining("; "));
    }

    private String getSupplierPaymentHistory(UUID supplierId) {
        List<com.threadpilot.payment.Payment> payments = getSupplierRecentPayments(supplierId, 20);
        return payments.stream()
                .map(p -> String.format("%s: %s (%s)", p.getPaymentDate(), p.getAmount(), p.getPaymentMethod()))
                .collect(Collectors.joining("; "));
    }

    private BigDecimal calculateSalesVelocity(UUID productId) {
        UUID orgId = TenantContext.requireTenantId();
        LocalDate start = LocalDate.now().minusDays(30);
        LocalDate end = LocalDate.now();

        List<com.threadpilot.sale.SaleItem> items = saleRepository.findByOrganizationId(orgId, org.springframework.data.domain.PageRequest.of(0, 1000)).getContent().stream()
                .flatMap(s -> s.getItems().stream())
                .filter(i -> i.getProduct() != null && i.getProduct().getId().equals(productId))
                .toList();

        int totalQty = items.stream().mapToInt(com.threadpilot.sale.SaleItem::getQuantity).sum();
        return BigDecimal.valueOf(totalQty).divide(BigDecimal.valueOf(30), 2, java.math.RoundingMode.HALF_UP);
    }

    private int calculateDaysOfStock(UUID productId) {
        Inventory inventory = inventoryRepository.findByProductIdAndOrganizationId(productId, TenantContext.requireTenantId()).orElse(null);
        if (inventory == null || inventory.getAvailableQuantity() <= 0) {
            return 0;
        }

        BigDecimal velocity = calculateSalesVelocity(productId);
        if (velocity.compareTo(BigDecimal.ZERO) == 0) {
            return 999;
        }

        return inventory.getAvailableQuantity() / velocity.intValue();
    }

    @lombok.Builder
    @lombok.Data
    public static class BusinessContext {
        private UUID organizationId;
        private List<Inventory> lowStockProducts;
        private List<Inventory> outOfStockProducts;
        private List<Customer> topCustomersByOutstanding;
        private List<Supplier> topSuppliersByOutstanding;
        private List<com.threadpilot.sale.Sale> recentSales;
        private List<com.threadpilot.payment.Payment> recentPayments;
        private BigDecimal totalInventoryValue;
        private BigDecimal totalReceivables;
        private BigDecimal totalPayables;
        private AnalyticsService.BusinessHealthScore businessHealthScore;
        private List<Inventory> slowMovingProducts;
        private List<BusinessEvent> recentEvents;
    }

    @lombok.Builder
    @lombok.Data
    public static class CustomerContext {
        private Customer customer;
        private List<com.threadpilot.order.CustomerOrder> recentOrders;
        private List<com.threadpilot.payment.Payment> recentPayments;
        private BigDecimal totalOutstanding;
        private BigDecimal creditLimit;
        private String paymentHistory;
    }

    @lombok.Builder
    @lombok.Data
    public static class SupplierContext {
        private Supplier supplier;
        private List<com.threadpilot.invoice.SupplierInvoice> recentInvoices;
        private List<com.threadpilot.payment.Payment> recentPayments;
        private BigDecimal totalOutstanding;
        private String paymentHistory;
    }

    @lombok.Builder
    @lombok.Data
    public static class ProductContext {
        private Product product;
        private Inventory inventory;
        private List<com.threadpilot.sale.Sale> recentSales;
        private List<com.threadpilot.inventory.StockMovement> recentMovements;
        private BigDecimal salesVelocity;
        private int daysOfStockRemaining;
    }
}

