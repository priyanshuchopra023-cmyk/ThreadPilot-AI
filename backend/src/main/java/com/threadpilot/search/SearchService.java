package com.threadpilot.search;

import com.threadpilot.common.dto.PageResponse;
import com.threadpilot.common.dto.PaginationRequest;
import com.threadpilot.customer.Customer;
import com.threadpilot.customer.CustomerRepository;
import com.threadpilot.inventory.Inventory;
import com.threadpilot.inventory.InventoryRepository;
import com.threadpilot.invoice.SupplierInvoice;
import com.threadpilot.invoice.SupplierInvoiceRepository;
import com.threadpilot.order.CustomerOrder;
import com.threadpilot.order.CustomerOrderRepository;
import com.threadpilot.organization.Organization;
import com.threadpilot.payment.Payment;
import com.threadpilot.payment.PaymentRepository;
import com.threadpilot.product.Product;
import com.threadpilot.product.ProductRepository;
import com.threadpilot.product.ProductVariant;
import com.threadpilot.product.ProductVariantRepository;
import com.threadpilot.sale.Sale;
import com.threadpilot.sale.SaleRepository;
import com.threadpilot.security.TenantContext;
import com.threadpilot.supplier.Supplier;
import com.threadpilot.supplier.SupplierRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SearchService {

    private final ProductRepository productRepository;
    private final ProductVariantRepository variantRepository;
    private final CustomerRepository customerRepository;
    private final SupplierRepository supplierRepository;
    private final CustomerOrderRepository orderRepository;
    private final SupplierInvoiceRepository invoiceRepository;
    private final SaleRepository saleRepository;
    private final PaymentRepository paymentRepository;
    private final InventoryRepository inventoryRepository;

    @Transactional(readOnly = true)
    public SearchResults search(String query) {
        UUID orgId = TenantContext.requireTenantId();
        String term = query.trim().toLowerCase();

        if (term.isEmpty()) {
            return SearchResults.empty();
        }

        List<SearchResult> results = new ArrayList<>();

        // Search products
        List<Product> products = productRepository.search(orgId, term, org.springframework.data.domain.PageRequest.of(0, 10)).getContent();
        results.addAll(products.stream()
                .map(p -> SearchResult.builder()
                        .type("PRODUCT")
                        .id(p.getId())
                        .title(p.getName())
                        .subtitle(p.getSku() + " | " + p.getCategory() + " | " + p.getBrand())
                        .url("/products/" + p.getId())
                        .build())
                .toList());

        // Search variants
        List<ProductVariant> variants = variantRepository.search(orgId, term, org.springframework.data.domain.PageRequest.of(0, 10)).getContent();
        results.addAll(variants.stream()
                .map(v -> SearchResult.builder()
                        .type("VARIANT")
                        .id(v.getId())
                        .title(v.getProduct().getName() + " - " + v.getColor() + "/" + v.getSize())
                        .subtitle(v.getSku())
                        .url("/products/" + v.getProduct().getId() + "/variants/" + v.getId())
                        .build())
                .toList());

        // Search customers
        List<Customer> customers = customerRepository.search(orgId, term, org.springframework.data.domain.PageRequest.of(0, 10)).getContent();
        results.addAll(customers.stream()
                .map(c -> SearchResult.builder()
                        .type("CUSTOMER")
                        .id(c.getId())
                        .title(c.getName())
                        .subtitle(c.getBusinessName() != null ? c.getBusinessName() : c.getCustomerType().name())
                        .url("/customers/" + c.getId())
                        .build())
                .toList());

        // Search suppliers
        List<Supplier> suppliers = supplierRepository.search(orgId, term, org.springframework.data.domain.PageRequest.of(0, 10)).getContent();
        results.addAll(suppliers.stream()
                .map(s -> SearchResult.builder()
                        .type("SUPPLIER")
                        .id(s.getId())
                        .title(s.getName())
                        .subtitle(s.getCompanyName() != null ? s.getCompanyName() : s.getCity())
                        .url("/suppliers/" + s.getId())
                        .build())
                .toList());

        // Search orders
        List<CustomerOrder> orders = orderRepository.findByOrganizationId(orgId, org.springframework.data.domain.PageRequest.of(0, 10)).getContent().stream()
                .filter(o -> o.getOrderNumber().toLowerCase().contains(term) ||
                        (o.getCustomer() != null && o.getCustomer().getName().toLowerCase().contains(term)))
                .limit(10)
                .toList();
        results.addAll(orders.stream()
                .map(o -> SearchResult.builder()
                        .type("ORDER")
                        .id(o.getId())
                        .title(o.getOrderNumber())
                        .subtitle(o.getCustomer() != null ? o.getCustomer().getName() : "Unknown")
                        .url("/orders/" + o.getId())
                        .build())
                .toList());

        // Search invoices
        List<SupplierInvoice> invoices = invoiceRepository.findByOrganizationId(orgId, org.springframework.data.domain.PageRequest.of(0, 10)).getContent().stream()
                .filter(i -> i.getInvoiceNumber().toLowerCase().contains(term) ||
                        i.getSupplier().getName().toLowerCase().contains(term))
                .limit(10)
                .toList();
        results.addAll(invoices.stream()
                .map(i -> SearchResult.builder()
                        .type("INVOICE")
                        .id(i.getId())
                        .title(i.getInvoiceNumber())
                        .subtitle(i.getSupplier().getName() + " | " + i.getStatus())
                        .url("/invoices/" + i.getId())
                        .build())
                .toList());

        // Search sales
        List<Sale> sales = saleRepository.findByOrganizationId(orgId, org.springframework.data.domain.PageRequest.of(0, 10)).getContent().stream()
                .filter(s -> s.getSaleNumber().toLowerCase().contains(term) ||
                        (s.getCustomer() != null && s.getCustomer().getName().toLowerCase().contains(term)))
                .limit(10)
                .toList();
        results.addAll(sales.stream()
                .map(s -> SearchResult.builder()
                        .type("SALE")
                        .id(s.getId())
                        .title(s.getSaleNumber())
                        .subtitle(s.getCustomer() != null ? s.getCustomer().getName() : "Walk-in")
                        .url("/sales/" + s.getId())
                        .build())
                .toList());

        // Group by type
        SearchResults grouped = new SearchResults();
        grouped.setProducts(results.stream().filter(r -> r.getType().equals("PRODUCT")).toList());
        grouped.setVariants(results.stream().filter(r -> r.getType().equals("VARIANT")).toList());
        grouped.setCustomers(results.stream().filter(r -> r.getType().equals("CUSTOMER")).toList());
        grouped.setSuppliers(results.stream().filter(r -> r.getType().equals("SUPPLIER")).toList());
        grouped.setOrders(results.stream().filter(r -> r.getType().equals("ORDER")).toList());
        grouped.setInvoices(results.stream().filter(r -> r.getType().equals("INVOICE")).toList());
        grouped.setSales(results.stream().filter(r -> r.getType().equals("SALE")).toList());
        grouped.setTotal(results.size());

        return grouped;
    }

    @lombok.Builder
    @lombok.Data
    public static class SearchResult {
        private String type;
        private UUID id;
        private String title;
        private String subtitle;
        private String url;
    }

    @lombok.Data
    public static class SearchResults {
        private List<SearchResult> products = new ArrayList<>();
        private List<SearchResult> variants = new ArrayList<>();
        private List<SearchResult> customers = new ArrayList<>();
        private List<SearchResult> suppliers = new ArrayList<>();
        private List<SearchResult> orders = new ArrayList<>();
        private List<SearchResult> invoices = new ArrayList<>();
        private List<SearchResult> sales = new ArrayList<>();
        private int total;

        public static SearchResults empty() {
            SearchResults r = new SearchResults();
            r.setTotal(0);
            return r;
        }
    }
}

