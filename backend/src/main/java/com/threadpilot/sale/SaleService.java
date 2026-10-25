package com.threadpilot.sale;

import com.threadpilot.common.dto.PageResponse;
import com.threadpilot.common.dto.PaginationRequest;
import com.threadpilot.common.exception.BusinessException;
import com.threadpilot.common.exception.ResourceNotFoundException;
import com.threadpilot.customer.Customer;
import com.threadpilot.customer.CustomerRepository;
import com.threadpilot.event.BusinessEvent;
import com.threadpilot.event.BusinessEventRepository;
import com.threadpilot.event.EventType;
import com.threadpilot.event.EventSeverity;
import com.threadpilot.order.CustomerOrder;
import com.threadpilot.order.CustomerOrderRepository;
import com.threadpilot.order.CustomerOrderItem;
import com.threadpilot.order.OrderStatus;
import com.threadpilot.organization.Organization;
import com.threadpilot.product.Product;
import com.threadpilot.product.ProductRepository;
import com.threadpilot.product.ProductVariant;
import com.threadpilot.product.ProductVariantRepository;
import com.threadpilot.security.TenantContext;
import com.threadpilot.user.User;
import com.threadpilot.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class SaleService {

    private final SaleRepository saleRepository;
    private final SaleItemRepository itemRepository;
    private final CustomerRepository customerRepository;
    private final CustomerOrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final ProductVariantRepository variantRepository;
    private final UserRepository userRepository;
    private final BusinessEventRepository businessEventRepository;

    @Transactional(readOnly = true)
    public PageResponse<Sale> getAll(PaginationRequest request) {
        UUID orgId = TenantContext.requireTenantId();
        Page<Sale> page = saleRepository.findByOrganizationId(orgId, request.toPageable());
        return PageResponse.of(page);
    }

    @Transactional(readOnly = true)
    public PageResponse<Sale> getByCustomer(UUID customerId, PaginationRequest request) {
        UUID orgId = TenantContext.requireTenantId();
        Page<Sale> page = saleRepository.findByCustomerId(customerId, orgId, request.toPageable());
        return PageResponse.of(page);
    }

    @Transactional(readOnly = true)
    public Sale getById(UUID id) {
        UUID orgId = TenantContext.requireTenantId();
        return saleRepository.findById(id)
                .filter(s -> s.getOrganization().getId().equals(orgId))
                .orElseThrow(() -> new ResourceNotFoundException("Sale", id));
    }

    @Transactional(readOnly = true)
    public List<Sale> getByDateRange(LocalDate start, LocalDate end) {
        UUID orgId = TenantContext.requireTenantId();
        return saleRepository.findByDateRange(orgId, start, end);
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

    @Transactional
    public Sale createFromOrder(UUID orderId) {
        UUID orgId = TenantContext.requireTenantId();
        UUID userId = TenantContext.getUserId();

        CustomerOrder order = orderRepository.findById(orderId)
                .filter(o -> o.getOrganization().getId().equals(orgId))
                .orElseThrow(() -> new ResourceNotFoundException("CustomerOrder", orderId));

        if (order.getStatus() != OrderStatus.DELIVERED && order.getStatus() != OrderStatus.SHIPPED) {
            throw new BusinessException("INVALID_STATE", "Can only create sale from delivered or shipped order");
        }

        if (saleRepository.existsByOrderId(orderId)) {
            throw new BusinessException("CONFLICT", "Sale already exists for this order");
        }

        Sale sale = Sale.builder()
                .saleNumber(generateSaleNumber())
                .saleDate(LocalDate.now())
                .customer(order.getCustomer())
                .order(order)
                .organization(new Organization() {{ setId(orgId); }})
                .createdBy(userId != null ? userRepository.findById(userId).orElse(null) : null)
                .build();
        sale = saleRepository.save(sale);

        // Create sale items from order items
        for (CustomerOrderItem orderItem : order.getItems()) {
            SaleItem saleItem = SaleItem.builder()
                    .quantity(orderItem.getFulfilledQuantity())
                    .unitPrice(orderItem.getUnitPrice())
                    .unitCost(getUnitCost(orderItem))
                    .taxRate(orderItem.getTaxRate())
                    .discountRate(orderItem.getDiscountRate())
                    .sale(sale)
                    .product(orderItem.getProduct())
                    .variant(orderItem.getVariant())
                    .organization(new Organization() {{ setId(orgId); }})
                    .build();
            saleItem.calculateAmounts();
            itemRepository.save(saleItem);
            sale.getItems().add(saleItem);
        }

        sale.calculateTotals();
        sale = saleRepository.save(sale);

        // Create business event
        createBusinessEvent(sale, EventType.SALE_CREATED, "Sale created: " + sale.getSaleNumber());

        log.info("Created sale: {} from order {}", sale.getSaleNumber(), order.getOrderNumber());
        return sale;
    }

@Transactional
    public Sale create(Sale sale) {
        final UUID orgId = TenantContext.requireTenantId();
        UUID userId = TenantContext.getUserId();

        // Capture values needed for lambdas before potential reassignment
        final UUID customerId = sale.getCustomer() != null ? sale.getCustomer().getId() : null;
        final UUID orderId = sale.getOrder() != null ? sale.getOrder().getId() : null;

        if (sale.getCustomer() != null && customerId != null) {
            Customer customer = customerRepository.findById(customerId)
                    .filter(c -> c.getOrganization().getId().equals(orgId))
                    .orElseThrow(() -> new ResourceNotFoundException("Customer", customerId));
            sale.setCustomer(customer);
        }

        if (sale.getOrder() != null && orderId != null) {
            CustomerOrder order = orderRepository.findById(orderId)
                    .filter(o -> o.getOrganization().getId().equals(orgId))
                    .orElseThrow(() -> new ResourceNotFoundException("CustomerOrder", orderId));
            sale.setOrder(order);
        }

        Organization organization = new Organization();
        organization.setId(orgId);

        sale.setSaleNumber(generateSaleNumber());
        sale.setOrganization(organization);
        sale.setCreatedBy(userId != null ? userRepository.findById(userId).orElse(null) : null);
        sale = saleRepository.save(sale);

        for (SaleItem item : sale.getItems()) {
            if (item.getProduct() != null) {
                Product product = productRepository.findById(item.getProduct().getId())
                        .filter(p -> p.getOrganization().getId().equals(orgId))
                        .orElseThrow(() -> new ResourceNotFoundException("Product", item.getProduct().getId()));
                item.setProduct(product);
            }

            if (item.getVariant() != null) {
                ProductVariant variant = variantRepository.findById(item.getVariant().getId())
                        .filter(v -> v.getOrganization().getId().equals(orgId))
                        .orElseThrow(() -> new ResourceNotFoundException("ProductVariant", item.getVariant().getId()));
                item.setVariant(variant);
            }

            item.setSale(sale);
            item.setOrganization(organization);
            item.calculateAmounts();
            itemRepository.save(item);
        }

        sale.calculateTotals();
        sale = saleRepository.save(sale);

        createBusinessEvent(sale, EventType.SALE_CREATED, "Sale created: " + sale.getSaleNumber());

        log.info("Created sale: {}", sale.getSaleNumber());
        return sale;
    }

@Transactional
    public Sale addItem(UUID saleId, SaleItem item) {
        final UUID orgId = TenantContext.requireTenantId();
        Sale sale = getById(saleId);

        if (item.getProduct() != null) {
            Product product = productRepository.findById(item.getProduct().getId())
                    .filter(p -> p.getOrganization().getId().equals(orgId))
                    .orElseThrow(() -> new ResourceNotFoundException("Product", item.getProduct().getId()));
            item.setProduct(product);
        }

        if (item.getVariant() != null) {
            ProductVariant variant = variantRepository.findById(item.getVariant().getId())
                    .filter(v -> v.getOrganization().getId().equals(orgId))
                    .orElseThrow(() -> new ResourceNotFoundException("ProductVariant", item.getVariant().getId()));
            item.setVariant(variant);
        }

        item.setSale(sale);
        Organization organization = new Organization();
        organization.setId(orgId);
        item.setOrganization(organization);
        item.calculateAmounts();
        itemRepository.save(item);
        sale.getItems().add(item);

        sale.calculateTotals();
        sale = saleRepository.save(sale);

        return sale;
    }

    private BigDecimal getUnitCost(CustomerOrderItem orderItem) {
        if (orderItem.getProduct() != null) {
            return orderItem.getProduct().getPurchasePrice();
        } else if (orderItem.getVariant() != null) {
            return orderItem.getVariant().getPurchasePrice();
        }
        return BigDecimal.ZERO;
    }

    private String generateSaleNumber() {
        return "SALE-" + System.currentTimeMillis();
    }

    private void createBusinessEvent(Sale sale, EventType eventType, String description) {
        UUID orgId = TenantContext.requireTenantId();
        BusinessEvent event = BusinessEvent.builder()
                .eventType(eventType)
                .entityType("SALE")
                .entityId(sale.getId())
                .entityReference(sale.getSaleNumber())
                .timestamp(Instant.now())
                .severity(EventSeverity.INFO)
                .description(description)
                .organization(new Organization() {{ setId(orgId); }})
                .build();
        businessEventRepository.save(event);
    }
}

