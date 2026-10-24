package com.threadpilot.invoice;

import com.threadpilot.common.dto.PageResponse;
import com.threadpilot.common.dto.PaginationRequest;
import com.threadpilot.common.exception.BusinessException;
import com.threadpilot.common.exception.ResourceNotFoundException;
import com.threadpilot.event.BusinessEvent;
import com.threadpilot.event.BusinessEventRepository;
import com.threadpilot.event.EventType;
import com.threadpilot.event.EventSeverity;
import com.threadpilot.inventory.Inventory;
import com.threadpilot.inventory.InventoryRepository;
import com.threadpilot.inventory.InventoryService;
import com.threadpilot.inventory.MovementType;
import com.threadpilot.inventory.StockMovement;
import com.threadpilot.inventory.StockMovementRepository;
import com.threadpilot.organization.Organization;
import com.threadpilot.product.Product;
import com.threadpilot.product.ProductRepository;
import com.threadpilot.product.ProductVariant;
import com.threadpilot.product.ProductVariantRepository;
import com.threadpilot.security.TenantContext;
import com.threadpilot.supplier.Supplier;
import com.threadpilot.supplier.SupplierRepository;
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
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class SupplierInvoiceService {

    private final SupplierInvoiceRepository invoiceRepository;
    private final SupplierInvoiceItemRepository itemRepository;
    private final SupplierRepository supplierRepository;
    private final ProductRepository productRepository;
    private final ProductVariantRepository variantRepository;
    private final InventoryRepository inventoryRepository;
    private final InventoryService inventoryService;
    private final StockMovementRepository stockMovementRepository;
    private final UserRepository userRepository;
    private final BusinessEventRepository businessEventRepository;

@Transactional(readOnly = true)
    public PageResponse<SupplierInvoice> getAll(PaginationRequest request) {
        UUID orgId = TenantContext.requireTenantId();
        Page<SupplierInvoice> page = invoiceRepository.findWithFilters(
                orgId,
                request.getStatus(),
                request.getOcrStatus(),
                request.getSupplierId() != null ? UUID.fromString(request.getSupplierId()) : null,
                request.toPageable()
        );
        return PageResponse.of(page);
    }

    @Transactional(readOnly = true)
    public PageResponse<SupplierInvoice> getBySupplier(UUID supplierId, PaginationRequest request) {
        UUID orgId = TenantContext.requireTenantId();
        Page<SupplierInvoice> page = invoiceRepository.findBySupplierId(supplierId, orgId, request.toPageable());
        return PageResponse.of(page);
    }

    @Transactional(readOnly = true)
    public SupplierInvoice getById(UUID id) {
        UUID orgId = TenantContext.requireTenantId();
        return invoiceRepository.findById(id)
                .filter(i -> i.getOrganization().getId().equals(orgId))
                .orElseThrow(() -> new ResourceNotFoundException("SupplierInvoice", id));
    }

    @Transactional(readOnly = true)
    public List<SupplierInvoice> getOverdue() {
        UUID orgId = TenantContext.requireTenantId();
        return invoiceRepository.findOverdue(orgId, LocalDate.now());
    }

    @Transactional(readOnly = true)
    public List<SupplierInvoice> getDueSoon(int days) {
        UUID orgId = TenantContext.requireTenantId();
        LocalDate today = LocalDate.now();
        LocalDate futureDate = today.plusDays(days);
        return invoiceRepository.findDueSoon(orgId, today, futureDate);
    }

    @Transactional(readOnly = true)
    public BigDecimal getTotalOutstanding() {
        UUID orgId = TenantContext.requireTenantId();
        return invoiceRepository.getTotalOutstanding(orgId);
    }

    @Transactional
    public SupplierInvoice create(SupplierInvoice invoice) {
        UUID orgId = TenantContext.requireTenantId();

        if (invoiceRepository.existsByInvoiceNumberAndOrganizationId(invoice.getInvoiceNumber(), orgId)) {
            throw new BusinessException("CONFLICT", "Invoice with number " + invoice.getInvoiceNumber() + " already exists");
        }

        Supplier supplier = supplierRepository.findById(invoice.getSupplier().getId())
                .filter(s -> s.getOrganization().getId().equals(orgId))
                .orElseThrow(() -> new ResourceNotFoundException("Supplier", invoice.getSupplier().getId()));

        Organization organization = new Organization();
        organization.setId(orgId);

        invoice.setSupplier(supplier);
        invoice.setOrganization(organization);
        invoice.setStatus(InvoiceStatus.DRAFT);
        invoice.setSubtotal(BigDecimal.ZERO);
        invoice.setTaxAmount(BigDecimal.ZERO);
        invoice.setDiscountAmount(BigDecimal.ZERO);
        invoice.setTotalAmount(BigDecimal.ZERO);
        invoice.setPaidAmount(BigDecimal.ZERO);
        invoice.setOutstandingAmount(BigDecimal.ZERO);

        return invoiceRepository.save(invoice);
    }

@Transactional
    public SupplierInvoice addItem(UUID invoiceId, SupplierInvoiceItem item) {
        final UUID orgId = TenantContext.requireTenantId();
        final UUID capturedOrgId = orgId;
        SupplierInvoice invoice = getById(invoiceId);

        if (invoice.getStatus() != InvoiceStatus.DRAFT && invoice.getStatus() != InvoiceStatus.PROCESSING) {
            throw new BusinessException("INVALID_STATE", "Cannot add items to invoice in status: " + invoice.getStatus());
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

        item.setInvoice(invoice);
        Organization organization = new Organization();
        organization.setId(orgId);
        item.setOrganization(organization);
        item.calculateLineTotal();
        item = itemRepository.save(item);

        recalculateInvoiceTotals(invoice);

        return invoiceRepository.save(invoice);
    }

@Transactional
    public SupplierInvoice verify(UUID invoiceId) {
        UUID orgId = TenantContext.requireTenantId();
        UUID userId = TenantContext.getUserId();

        // Use pessimistic locking to prevent concurrent verification
        SupplierInvoice invoice = invoiceRepository.findByIdWithLock(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("SupplierInvoice", invoiceId));

        // Re-verify the invoice belongs to the current organization (double-check after lock)
        if (!invoice.getOrganization().getId().equals(orgId)) {
            throw new ResourceNotFoundException("SupplierInvoice", invoiceId);
        }

        if (invoice.getStatus() == InvoiceStatus.VERIFIED || invoice.getStatus() == InvoiceStatus.PAID) {
            throw new BusinessException("INVALID_STATE", "Invoice is already verified or paid");
        }

        // Update inventory for each item
        for (SupplierInvoiceItem item : invoice.getItems()) {
            if (item.getProduct() != null) {
                inventoryService.adjustStock(
                        item.getProduct().getId(),
                        null,
                        item.getQuantity(),
                        MovementType.PURCHASE,
                        "Invoice verified: " + invoice.getInvoiceNumber(),
                        "SUPPLIER_INVOICE",
                        invoice.getId(),
                        invoice.getInvoiceNumber()
                );
            } else if (item.getVariant() != null) {
                inventoryService.adjustStock(
                        null,
                        item.getVariant().getId(),
                        item.getQuantity(),
                        MovementType.PURCHASE,
                        "Invoice verified: " + invoice.getInvoiceNumber(),
                        "SUPPLIER_INVOICE",
                        invoice.getId(),
                        invoice.getInvoiceNumber()
                );
            }
        }

        // Update supplier outstanding
        Supplier supplier = invoice.getSupplier();
        supplier.setOutstandingAmount(supplier.getOutstandingAmount().add(invoice.getTotalAmount()));
        supplierRepository.save(supplier);

        // Update invoice status
        invoice.setStatus(InvoiceStatus.VERIFIED);
        invoice.setVerifiedBy(userId != null ? userRepository.findById(userId).orElse(null) : null);
        invoice.setVerifiedAt(Instant.now());
        invoice = invoiceRepository.save(invoice);

        // Create business event
        createBusinessEvent(invoice, EventType.INVOICE_VERIFIED, "Invoice verified: " + invoice.getInvoiceNumber());

        log.info("Verified supplier invoice: {}", invoice.getInvoiceNumber());
        return invoice;
    }

    @Transactional
    public SupplierInvoice update(UUID id, SupplierInvoice invoice) {
        UUID orgId = TenantContext.requireTenantId();
        SupplierInvoice existing = getById(id);

        if (existing.getStatus() != InvoiceStatus.DRAFT && existing.getStatus() != InvoiceStatus.PROCESSING) {
            throw new BusinessException("INVALID_STATE", "Cannot update invoice in status: " + existing.getStatus());
        }

        if (!existing.getInvoiceNumber().equals(invoice.getInvoiceNumber()) &&
                invoiceRepository.existsByInvoiceNumberAndOrganizationId(invoice.getInvoiceNumber(), orgId)) {
            throw new BusinessException("CONFLICT", "Invoice with number " + invoice.getInvoiceNumber() + " already exists");
        }

        existing.setInvoiceNumber(invoice.getInvoiceNumber());
        existing.setInvoiceDate(invoice.getInvoiceDate());
        existing.setDueDate(invoice.getDueDate());
        existing.setNotes(invoice.getNotes());
        existing.setDocumentUrl(invoice.getDocumentUrl());

        return invoiceRepository.save(existing);
    }

    @Transactional
    public void delete(UUID id) {
        UUID orgId = TenantContext.requireTenantId();
        SupplierInvoice invoice = getById(id);

        if (invoice.getStatus() == InvoiceStatus.VERIFIED || invoice.getStatus() == InvoiceStatus.PAID ||
                invoice.getStatus() == InvoiceStatus.PARTIALLY_PAID) {
            throw new BusinessException("INVALID_STATE", "Cannot delete verified or paid invoice");
        }

        invoiceRepository.delete(invoice);
        log.info("Deleted supplier invoice: {}", invoice.getInvoiceNumber());
    }

    public void recalculateInvoiceTotals(SupplierInvoice invoice) {
        BigDecimal subtotal = invoice.getItems().stream()
                .map(SupplierInvoiceItem::getLineTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal taxAmount = invoice.getItems().stream()
                .map(item -> item.getLineTotal().subtract(item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity())).subtract(
                        item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity())).multiply(item.getDiscountRate().divide(BigDecimal.valueOf(100)))
                )).multiply(item.getTaxRate().divide(BigDecimal.valueOf(100))))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal discountAmount = invoice.getItems().stream()
                .map(item -> item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity())).multiply(item.getDiscountRate().divide(BigDecimal.valueOf(100))))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalAmount = subtotal.add(taxAmount).subtract(discountAmount);

        invoice.setSubtotal(subtotal);
        invoice.setTaxAmount(taxAmount);
        invoice.setDiscountAmount(discountAmount);
        invoice.setTotalAmount(totalAmount);
        invoice.setOutstandingAmount(totalAmount.subtract(invoice.getPaidAmount()));
    }

    private void createBusinessEvent(SupplierInvoice invoice, EventType eventType, String description) {
        UUID orgId = TenantContext.requireTenantId();
        BusinessEvent event = BusinessEvent.builder()
                .eventType(eventType)
                .entityType("SUPPLIER_INVOICE")
                .entityId(invoice.getId())
                .entityReference(invoice.getInvoiceNumber())
                .timestamp(Instant.now())
                .severity(EventSeverity.INFO)
                .description(description)
                .organization(new Organization() {{ setId(orgId); }})
                .build();
        businessEventRepository.save(event);
    }
}

