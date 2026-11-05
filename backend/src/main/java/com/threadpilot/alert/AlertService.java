package com.threadpilot.alert;

import com.threadpilot.common.dto.PageResponse;
import com.threadpilot.common.dto.PaginationRequest;
import com.threadpilot.common.exception.ResourceNotFoundException;
import com.threadpilot.event.BusinessEventRepository;
import com.threadpilot.event.EventType;
import com.threadpilot.event.EventSeverity;
import com.threadpilot.inventory.Inventory;
import com.threadpilot.inventory.InventoryRepository;
import com.threadpilot.organization.Organization;
import com.threadpilot.organization.OrganizationRepository;
import com.threadpilot.security.TenantContext;
import com.threadpilot.supplier.Supplier;
import com.threadpilot.supplier.SupplierRepository;
import com.threadpilot.customer.Customer;
import com.threadpilot.customer.CustomerRepository;
import com.threadpilot.invoice.SupplierInvoice;
import com.threadpilot.invoice.SupplierInvoiceRepository;
import com.threadpilot.order.CustomerOrderRepository;
import com.threadpilot.user.User;
import com.threadpilot.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.scheduling.annotation.Scheduled;
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
public class AlertService {

    private final AlertRepository alertRepository;
    private final InventoryRepository inventoryRepository;
    private final SupplierRepository supplierRepository;
    private final CustomerRepository customerRepository;
    private final SupplierInvoiceRepository invoiceRepository;
    private final CustomerOrderRepository orderRepository;
    private final UserRepository userRepository;
    private final BusinessEventRepository businessEventRepository;
    private final OrganizationRepository organizationRepository;

    @Transactional(readOnly = true)
    public PageResponse<Alert> getAll(PaginationRequest request) {
        UUID orgId = TenantContext.requireTenantId();
        var page = alertRepository.findByOrganizationId(orgId, request.toPageable());
        return PageResponse.of(page);
    }

    @Transactional(readOnly = true)
    public PageResponse<Alert> getAll(PaginationRequest request, String status, String severity) {
        UUID orgId = TenantContext.requireTenantId();
        Page<Alert> page;
        
        if (status != null && !status.isEmpty() && severity != null && !severity.isEmpty()) {
            AlertStatus alertStatus = AlertStatus.valueOf(status.toUpperCase());
            AlertSeverity alertSeverity = AlertSeverity.valueOf(severity.toUpperCase());
            page = alertRepository.findBySeverityAndStatus(orgId, alertSeverity, alertStatus, request.toPageable());
        } else if (status != null && !status.isEmpty()) {
            AlertStatus alertStatus = AlertStatus.valueOf(status.toUpperCase());
            page = alertRepository.findByStatus(orgId, alertStatus, request.toPageable());
        } else if (severity != null && !severity.isEmpty()) {
            AlertSeverity alertSeverity = AlertSeverity.valueOf(severity.toUpperCase());
            page = alertRepository.findBySeverity(orgId, alertSeverity, request.toPageable());
        } else {
            page = alertRepository.findByOrganizationId(orgId, request.toPageable());
        }
        
        return PageResponse.of(page);
    }

    @Transactional(readOnly = true)
    public PageResponse<Alert> getUnread(PaginationRequest request) {
        UUID orgId = TenantContext.requireTenantId();
        var page = alertRepository.findUnreadByOrganizationId(orgId, request.toPageable());
        return PageResponse.of(page);
    }

    @Transactional(readOnly = true)
    public List<Alert> getMyUnreadAlerts() {
        UUID userId = TenantContext.getUserId();
        return alertRepository.findUnreadByAssignedUser(userId);
    }

    @Transactional(readOnly = true)
    public long getUnreadCount() {
        UUID orgId = TenantContext.requireTenantId();
        return alertRepository.countUnread(orgId);
    }

    @Transactional
    public Alert markAsRead(UUID id) {
        UUID orgId = TenantContext.requireTenantId();
        Alert alert = alertRepository.findById(id)
                .filter(a -> a.getOrganization().getId().equals(orgId))
                .orElseThrow(() -> new ResourceNotFoundException("Alert", id));

        alert.setStatus(AlertStatus.READ);
        alert.setReadAt(Instant.now());
        alert.setReadBy(userRepository.findById(TenantContext.getUserId()).orElse(null));
        return alertRepository.save(alert);
    }

    @Transactional
    public Alert dismiss(UUID id) {
        UUID orgId = TenantContext.requireTenantId();
        Alert alert = alertRepository.findById(id)
                .filter(a -> a.getOrganization().getId().equals(orgId))
                .orElseThrow(() -> new ResourceNotFoundException("Alert", id));

        alert.setStatus(AlertStatus.DISMISSED);
        alert.setDismissedAt(Instant.now());
        alert.setDismissedBy(userRepository.findById(TenantContext.getUserId()).orElse(null));
        return alertRepository.save(alert);
    }

    @Transactional
    public Alert resolve(UUID id) {
        UUID orgId = TenantContext.requireTenantId();
        Alert alert = alertRepository.findById(id)
                .filter(a -> a.getOrganization().getId().equals(orgId))
                .orElseThrow(() -> new ResourceNotFoundException("Alert", id));

        alert.setStatus(AlertStatus.RESOLVED);
        alert.setResolvedAt(Instant.now());
        alert.setResolvedBy(userRepository.findById(TenantContext.getUserId()).orElse(null));
        return alertRepository.save(alert);
    }

    @Transactional
    public long markAllAsRead() {
        UUID orgId = TenantContext.requireTenantId();
        UUID userId = TenantContext.getUserId();
        List<Alert> unread = alertRepository.findUnreadByAssignedUser(userId);
        for (Alert alert : unread) {
            alert.setStatus(AlertStatus.READ);
            alert.setReadAt(Instant.now());
            alert.setReadBy(userRepository.findById(userId).orElse(null));
        }
        alertRepository.saveAll(unread);
        return unread.size();
    }

    // Scheduled alert generation for all active organizations safely without relying on request tenant context
    @Scheduled(cron = "0 0 6 * * ?") // Daily at 6 AM
    public void generateDailyAlerts() {
        List<Organization> activeOrgs = organizationRepository.findAllActive();
        log.info("Generating daily alerts for {} active organizations", activeOrgs.size());

        for (Organization org : activeOrgs) {
            try {
                TenantContext.setOrganizationId(org.getId());
                generateDailyAlertsForOrg(org.getId());
            } catch (Exception e) {
                log.error("Failed to generate daily alerts for organization: {}", org.getId(), e);
            } finally {
                TenantContext.clear();
            }
        }
    }

    @Transactional
    public void generateAlertsForCurrentOrg() {
        UUID orgId = TenantContext.requireTenantId();
        generateDailyAlertsForOrg(orgId);
    }

    @Transactional
    public void generateDailyAlertsForOrg(UUID orgId) {
        log.info("Generating daily alerts for organization: {}", orgId);

        // Low stock alerts
        generateLowStockAlerts(orgId);

        // Out of stock alerts
        generateOutOfStockAlerts(orgId);

        // Overdue customer payments
        generateOverdueCustomerAlerts(orgId);

        // Overdue supplier invoices
        generateOverdueSupplierAlerts(orgId);

        // Due soon supplier invoices
        generateDueSoonSupplierAlerts(orgId);

        // Slow moving inventory
        generateSlowMovingAlerts(orgId);
    }

    private void generateLowStockAlerts(UUID orgId) {
        List<Inventory> lowStock = inventoryRepository.findLowStock(orgId, 10);
        for (Inventory inv : lowStock) {
            String entityType = inv.getProduct() != null ? "PRODUCT" : "PRODUCT_VARIANT";
            UUID entityId = inv.getProduct() != null ? inv.getProduct().getId() : inv.getVariant().getId();
            String name = inv.getProduct() != null ? inv.getProduct().getName() : inv.getVariant().getSku();

            if (!alertExists(entityType, entityId, AlertType.LOW_STOCK, orgId)) {
                Alert alert = Alert.builder()
                        .alertType(AlertType.LOW_STOCK)
                        .severity(AlertSeverity.WARNING)
                        .status(AlertStatus.UNREAD)
                        .title("Low Stock: " + name)
                        .message(String.format("%s has only %d units available (minimum: %d)",
                                name, inv.getAvailableQuantity(),
                                inv.getProduct() != null ? inv.getProduct().getMinStockLevel() : inv.getVariant().getMinStockLevel()))
                        .entityType(entityType)
                        .entityId(entityId)
                        .organization(new Organization() {{ setId(orgId); }})
                        .actionUrl("/inventory/" + entityId)
                        .actionLabel("View Inventory")
                        .build();
                alertRepository.save(alert);
            }
        }
    }

    private void generateOutOfStockAlerts(UUID orgId) {
        List<Inventory> outOfStock = inventoryRepository.findOutOfStock(orgId);
        for (Inventory inv : outOfStock) {
            String entityType = inv.getProduct() != null ? "PRODUCT" : "PRODUCT_VARIANT";
            UUID entityId = inv.getProduct() != null ? inv.getProduct().getId() : inv.getVariant().getId();
            String name = inv.getProduct() != null ? inv.getProduct().getName() : inv.getVariant().getSku();

            if (!alertExists(entityType, entityId, AlertType.OUT_OF_STOCK, orgId)) {
                Alert alert = Alert.builder()
                        .alertType(AlertType.OUT_OF_STOCK)
                        .severity(AlertSeverity.CRITICAL)
                        .status(AlertStatus.UNREAD)
                        .title("Out of Stock: " + name)
                        .message(String.format("%s is completely out of stock", name))
                        .entityType(entityType)
                        .entityId(entityId)
                        .organization(new Organization() {{ setId(orgId); }})
                        .actionUrl("/inventory/" + entityId)
                        .actionLabel("View Inventory")
                        .build();
                alertRepository.save(alert);
            }
        }
    }

    private void generateOverdueCustomerAlerts(UUID orgId) {
        List<Customer> overdue = customerRepository.findWithOutstandingActive(orgId);
        for (Customer customer : overdue) {
            if (customer.getOutstandingAmount().compareTo(BigDecimal.ZERO) > 0) {
                if (!alertExists("CUSTOMER", customer.getId(), AlertType.CUSTOMER_OVERDUE, orgId)) {
                    Alert alert = Alert.builder()
                            .alertType(AlertType.CUSTOMER_OVERDUE)
                            .severity(customer.getOutstandingAmount().compareTo(BigDecimal.valueOf(100000)) > 0 ? AlertSeverity.CRITICAL : AlertSeverity.WARNING)
                            .status(AlertStatus.UNREAD)
                            .title("Customer Overdue: " + customer.getName())
                            .message(String.format("%s has outstanding amount of %s", customer.getName(), customer.getOutstandingAmount()))
                            .entityType("CUSTOMER")
                            .entityId(customer.getId())
                            .organization(new Organization() {{ setId(orgId); }})
                            .actionUrl("/customers/" + customer.getId())
                            .actionLabel("View Customer")
                            .build();
                    alertRepository.save(alert);
                }
            }
        }
    }

    private void generateOverdueSupplierAlerts(UUID orgId) {
        List<SupplierInvoice> overdue = invoiceRepository.findOverdue(orgId, LocalDate.now());
        for (SupplierInvoice invoice : overdue) {
            if (!alertExists("SUPPLIER_INVOICE", invoice.getId(), AlertType.INVOICE_OVERDUE, orgId)) {
                Alert alert = Alert.builder()
                        .alertType(AlertType.INVOICE_OVERDUE)
                        .severity(AlertSeverity.WARNING)
                        .status(AlertStatus.UNREAD)
                        .title("Supplier Invoice Overdue: " + invoice.getInvoiceNumber())
                        .message(String.format("Invoice %s from %s is overdue. Amount: %s",
                                invoice.getInvoiceNumber(), invoice.getSupplier().getName(), invoice.getOutstandingAmount()))
                        .entityType("SUPPLIER_INVOICE")
                        .entityId(invoice.getId())
                        .organization(new Organization() {{ setId(orgId); }})
                        .actionUrl("/invoices/" + invoice.getId())
                        .actionLabel("View Invoice")
                        .build();
                alertRepository.save(alert);
            }
        }
    }

    private void generateDueSoonSupplierAlerts(UUID orgId) {
        List<SupplierInvoice> dueSoon = invoiceRepository.findDueSoon(orgId, LocalDate.now(), LocalDate.now().plusDays(7));
        for (SupplierInvoice invoice : dueSoon) {
            if (!alertExists("SUPPLIER_INVOICE", invoice.getId(), AlertType.PAYMENT_DUE, orgId)) {
                Alert alert = Alert.builder()
                        .alertType(AlertType.PAYMENT_DUE)
                        .severity(AlertSeverity.INFO)
                        .status(AlertStatus.UNREAD)
                        .title("Supplier Payment Due Soon: " + invoice.getInvoiceNumber())
                        .message(String.format("Invoice %s from %s is due on %s. Amount: %s",
                                invoice.getInvoiceNumber(), invoice.getSupplier().getName(), invoice.getDueDate(), invoice.getOutstandingAmount()))
                        .entityType("SUPPLIER_INVOICE")
                        .entityId(invoice.getId())
                        .organization(new Organization() {{ setId(orgId); }})
                        .actionUrl("/invoices/" + invoice.getId())
                        .actionLabel("View Invoice")
                        .build();
                alertRepository.save(alert);
            }
        }
    }

    private void generateSlowMovingAlerts(UUID orgId) {
        // Find slow moving inventory
        List<Inventory> slowMoving = inventoryRepository.findWithStock(orgId).stream()
                .filter(i -> i.getCurrentQuantity() > 100 && i.getLastMovementAt() != null
                        && i.getLastMovementAt().isBefore(Instant.now().minusSeconds(90 * 24 * 60 * 60)))
                .limit(10)
                .toList();

        for (Inventory inv : slowMoving) {
            String entityType = inv.getProduct() != null ? "PRODUCT" : "PRODUCT_VARIANT";
            UUID entityId = inv.getProduct() != null ? inv.getProduct().getId() : inv.getVariant().getId();
            String name = inv.getProduct() != null ? inv.getProduct().getName() : inv.getVariant().getSku();

            if (!alertExists(entityType, entityId, AlertType.SLOW_MOVING_INVENTORY, orgId)) {
                Alert alert = Alert.builder()
                        .alertType(AlertType.SLOW_MOVING_INVENTORY)
                        .severity(AlertSeverity.INFO)
                        .status(AlertStatus.UNREAD)
                        .title("Slow Moving: " + name)
                        .message(String.format("%s has %d units in stock with no movement for 90+ days", name, inv.getCurrentQuantity()))
                        .entityType(entityType)
                        .entityId(entityId)
                        .organization(new Organization() {{ setId(orgId); }})
                        .actionUrl("/inventory/" + entityId)
                        .actionLabel("View Inventory")
                        .build();
                alertRepository.save(alert);
            }
        }
    }

    private boolean alertExists(String entityType, UUID entityId, AlertType alertType, UUID orgId) {
        return alertRepository.findByEntity(orgId, entityType, entityId).stream()
                .anyMatch(a -> a.getAlertType() == alertType && a.getStatus() != AlertStatus.RESOLVED && a.getStatus() != AlertStatus.DISMISSED);
    }
}
