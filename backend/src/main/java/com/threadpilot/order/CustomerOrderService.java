package com.threadpilot.order;

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
import com.threadpilot.inventory.InventoryService;
import com.threadpilot.inventory.MovementType;
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
public class CustomerOrderService {

    private final CustomerOrderRepository orderRepository;
    private final CustomerOrderItemRepository itemRepository;
    private final CustomerRepository customerRepository;
    private final ProductRepository productRepository;
    private final ProductVariantRepository variantRepository;
    private final InventoryService inventoryService;
    private final UserRepository userRepository;
    private final BusinessEventRepository businessEventRepository;

    @Transactional(readOnly = true)
    public PageResponse<CustomerOrder> getAll(PaginationRequest request) {
        UUID orgId = TenantContext.requireTenantId();
        Page<CustomerOrder> page = orderRepository.findByOrganizationId(orgId, request.toPageable());
        return PageResponse.of(page);
    }

    @Transactional(readOnly = true)
    public PageResponse<CustomerOrder> getByCustomer(UUID customerId, PaginationRequest request) {
        UUID orgId = TenantContext.requireTenantId();
        Page<CustomerOrder> page = orderRepository.findByCustomerId(customerId, orgId, request.toPageable());
        return PageResponse.of(page);
    }

    @Transactional(readOnly = true)
    public CustomerOrder getById(UUID id) {
        UUID orgId = TenantContext.requireTenantId();
        return orderRepository.findById(id)
                .filter(o -> o.getOrganization().getId().equals(orgId))
                .orElseThrow(() -> new ResourceNotFoundException("CustomerOrder", id));
    }

    @Transactional(readOnly = true)
    public List<CustomerOrder> getPendingFulfillment() {
        UUID orgId = TenantContext.requireTenantId();
        return orderRepository.findPendingFulfillment(orgId);
    }

    @Transactional(readOnly = true)
    public List<CustomerOrder> getWithOutstanding() {
        UUID orgId = TenantContext.requireTenantId();
        return orderRepository.findWithOutstanding(orgId);
    }

    @Transactional(readOnly = true)
    public BigDecimal getTotalOutstanding() {
        UUID orgId = TenantContext.requireTenantId();
        return orderRepository.getTotalOutstanding(orgId);
    }

    @Transactional
    public CustomerOrder create(CustomerOrder order) {
        UUID orgId = TenantContext.requireTenantId();

        if (orderRepository.existsByOrderNumberAndOrganizationId(order.getOrderNumber(), orgId)) {
            throw new BusinessException("CONFLICT", "Order with number " + order.getOrderNumber() + " already exists");
        }

        Customer customer = customerRepository.findById(order.getCustomer().getId())
                .filter(c -> c.getOrganization().getId().equals(orgId))
                .orElseThrow(() -> new ResourceNotFoundException("Customer", order.getCustomer().getId()));

        Organization organization = new Organization();
        organization.setId(orgId);

        order.setCustomer(customer);
        order.setOrganization(organization);
        order.setStatus(OrderStatus.DRAFT);
        order.setPaymentStatus(PaymentStatus.PENDING);
        order.setFulfillmentStatus(FulfillmentStatus.PENDING);
        order.setSubtotal(BigDecimal.ZERO);
        order.setTaxAmount(BigDecimal.ZERO);
        order.setDiscountAmount(BigDecimal.ZERO);
        order.setTotalAmount(BigDecimal.ZERO);
        order.setPaidAmount(BigDecimal.ZERO);
        order.setOutstandingAmount(BigDecimal.ZERO);

        return orderRepository.save(order);
    }

    @Transactional
    public CustomerOrder addItem(UUID orderId, CustomerOrderItem item) {
        final UUID orgId = TenantContext.requireTenantId();
        final UUID capturedOrgId = orgId;
        CustomerOrder order = getById(orderId);

        if (order.getStatus() != OrderStatus.DRAFT) {
            throw new BusinessException("INVALID_STATE", "Cannot add items to order in status: " + order.getStatus());
        }

        // Capture values needed for lambdas before potential reassignment
        final UUID productId = item.getProduct() != null ? item.getProduct().getId() : null;
        final UUID variantId = item.getVariant() != null ? item.getVariant().getId() : null;

        if (item.getProduct() != null) {
            Product product = productRepository.findById(productId)
                    .filter(p -> p.getOrganization().getId().equals(capturedOrgId))
                    .orElseThrow(() -> new ResourceNotFoundException("Product", productId));
            item.setProduct(product);
        }

        if (item.getVariant() != null) {
            ProductVariant variant = variantRepository.findById(variantId)
                    .filter(v -> v.getOrganization().getId().equals(capturedOrgId))
                    .orElseThrow(() -> new ResourceNotFoundException("ProductVariant", variantId));
            item.setVariant(variant);
        }

        item.setOrder(order);
        Organization organization = new Organization();
        organization.setId(orgId);
        item.setOrganization(organization);
        item.calculateLineTotal();
        item = itemRepository.save(item);

        recalculateOrderTotals(order);

        return orderRepository.save(order);
    }

    @Transactional
    public CustomerOrder confirm(UUID orderId) {
        UUID orgId = TenantContext.requireTenantId();
        UUID userId = TenantContext.getUserId();

        CustomerOrder order = getById(orderId);

        if (order.getStatus() != OrderStatus.DRAFT) {
            throw new BusinessException("INVALID_STATE", "Can only confirm orders in DRAFT status");
        }

        if (order.getItems().isEmpty()) {
            throw new BusinessException("INVALID_STATE", "Cannot confirm order with no items");
        }

        Customer customer = order.getCustomer();

        // Enforce customer credit limit policy
        if (customer.getCreditLimit() != null && customer.getCreditLimit().compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal currentOutstanding = customer.getOutstandingAmount() != null ? customer.getOutstandingAmount() : BigDecimal.ZERO;
            BigDecimal projectedBalance = currentOutstanding.add(order.getTotalAmount());
            if (projectedBalance.compareTo(customer.getCreditLimit()) > 0) {
                throw new BusinessException("CREDIT_LIMIT_EXCEEDED",
                        String.format("Order total (%s) plus current outstanding (%s) exceeds credit limit (%s) for customer '%s'",
                                order.getTotalAmount(), currentOutstanding, customer.getCreditLimit(), customer.getName()));
            }
        }

        // Reserve inventory for each item
        for (CustomerOrderItem item : order.getItems()) {
            if (item.getProduct() != null) {
                inventoryService.reserveStock(item.getProduct().getId(), null, item.getQuantity(), "CUSTOMER_ORDER", order.getId());
                item.reserve(item.getQuantity());
            } else if (item.getVariant() != null) {
                inventoryService.reserveStock(null, item.getVariant().getId(), item.getQuantity(), "CUSTOMER_ORDER", order.getId());
                item.reserve(item.getQuantity());
            }
            itemRepository.save(item);
        }

        order.setStatus(OrderStatus.CONFIRMED);
        order.setConfirmedBy(userId != null ? userRepository.findById(userId).orElse(null) : null);
        order.setConfirmedAt(Instant.now());
        order = orderRepository.save(order);

        // Update customer outstanding
        customer.setOutstandingAmount(customer.getOutstandingAmount().add(order.getTotalAmount()));
        customerRepository.save(customer);

        // Create business event
        createBusinessEvent(order, EventType.ORDER_CONFIRMED, "Order confirmed: " + order.getOrderNumber());

        log.info("Confirmed customer order: {}", order.getOrderNumber());
        return order;
    }

    @Transactional
    public CustomerOrder fulfill(UUID orderId) {
        UUID orgId = TenantContext.requireTenantId();

        CustomerOrder order = getById(orderId);

        if (order.getStatus() != OrderStatus.CONFIRMED && order.getStatus() != OrderStatus.PROCESSING &&
                order.getStatus() != OrderStatus.READY) {
            throw new BusinessException("INVALID_STATE", "Cannot fulfill order in status: " + order.getStatus());
        }

        // Convert reserved inventory to sold
        for (CustomerOrderItem item : order.getItems()) {
            if (item.getProduct() != null) {
                inventoryService.confirmSale(item.getProduct().getId(), null, item.getQuantity(), "CUSTOMER_ORDER", order.getId());
            } else if (item.getVariant() != null) {
                inventoryService.confirmSale(null, item.getVariant().getId(), item.getQuantity(), "CUSTOMER_ORDER", order.getId());
            }
            item.fulfill(item.getQuantity());
            itemRepository.save(item);
        }

        order.setStatus(OrderStatus.DELIVERED);
        order.setFulfillmentStatus(FulfillmentStatus.FULFILLED);
        order.setActualDeliveryDate(LocalDate.now());
        order = orderRepository.save(order);

        // Create business event
        createBusinessEvent(order, EventType.ORDER_FULFILLED, "Order fulfilled: " + order.getOrderNumber());

        log.info("Fulfilled customer order: {}", order.getOrderNumber());
        return order;
    }

    @Transactional
    public CustomerOrder update(UUID id, CustomerOrder order) {
        UUID orgId = TenantContext.requireTenantId();
        CustomerOrder existing = getById(id);

        if (existing.getStatus() != OrderStatus.DRAFT) {
            throw new BusinessException("INVALID_STATE", "Cannot update order in status: " + existing.getStatus());
        }

        if (!existing.getOrderNumber().equals(order.getOrderNumber()) &&
                orderRepository.existsByOrderNumberAndOrganizationId(order.getOrderNumber(), orgId)) {
            throw new BusinessException("CONFLICT", "Order with number " + order.getOrderNumber() + " already exists");
        }

        existing.setOrderNumber(order.getOrderNumber());
        existing.setOrderDate(order.getOrderDate());
        existing.setExpectedDeliveryDate(order.getExpectedDeliveryDate());
        existing.setNotes(order.getNotes());
        existing.setShippingAddress(order.getShippingAddress());

        return orderRepository.save(existing);
    }

    @Transactional
    public void delete(UUID id) {
        UUID orgId = TenantContext.requireTenantId();
        CustomerOrder order = getById(id);

        if (order.getStatus() != OrderStatus.DRAFT && order.getStatus() != OrderStatus.CANCELLED) {
            throw new BusinessException("INVALID_STATE", "Cannot delete order in status: " + order.getStatus());
        }

        orderRepository.delete(order);
        log.info("Deleted customer order: {}", order.getOrderNumber());
    }

    private void recalculateOrderTotals(CustomerOrder order) {
        if (order.getItems() == null || order.getItems().isEmpty()) {
            order.setSubtotal(BigDecimal.ZERO);
            order.setTaxAmount(BigDecimal.ZERO);
            order.setDiscountAmount(BigDecimal.ZERO);
            order.setTotalAmount(BigDecimal.ZERO);
            order.setOutstandingAmount(BigDecimal.ZERO);
            return;
        }

        BigDecimal subtotal = order.getItems().stream()
                .map(CustomerOrderItem::getBaseAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, java.math.RoundingMode.HALF_UP);

        BigDecimal discountAmount = order.getItems().stream()
                .map(CustomerOrderItem::getDiscountAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, java.math.RoundingMode.HALF_UP);

        BigDecimal taxAmount = order.getItems().stream()
                .map(CustomerOrderItem::getTaxAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, java.math.RoundingMode.HALF_UP);

        BigDecimal totalAmount = subtotal.subtract(discountAmount).add(taxAmount).setScale(2, java.math.RoundingMode.HALF_UP);
        BigDecimal paidAmount = order.getPaidAmount() != null ? order.getPaidAmount() : BigDecimal.ZERO;
        BigDecimal outstanding = totalAmount.subtract(paidAmount).setScale(2, java.math.RoundingMode.HALF_UP);

        order.setSubtotal(subtotal);
        order.setTaxAmount(taxAmount);
        order.setDiscountAmount(discountAmount);
        order.setTotalAmount(totalAmount);
        order.setOutstandingAmount(outstanding.compareTo(BigDecimal.ZERO) < 0 ? BigDecimal.ZERO : outstanding);
    }

    private void createBusinessEvent(CustomerOrder order, EventType eventType, String description) {
        UUID orgId = TenantContext.requireTenantId();
        BusinessEvent event = BusinessEvent.builder()
                .eventType(eventType)
                .entityType("CUSTOMER_ORDER")
                .entityId(order.getId())
                .entityReference(order.getOrderNumber())
                .timestamp(Instant.now())
                .severity(EventSeverity.INFO)
                .description(description)
                .organization(new Organization() {{ setId(orgId); }})
                .build();
        businessEventRepository.save(event);
    }
}
