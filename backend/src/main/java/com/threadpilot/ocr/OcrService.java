package com.threadpilot.ocr;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.threadpilot.common.exception.BusinessException;
import com.threadpilot.invoice.SupplierInvoice;
import com.threadpilot.invoice.SupplierInvoiceItem;
import com.threadpilot.invoice.SupplierInvoiceItemRepository;
import com.threadpilot.invoice.SupplierInvoiceRepository;
import com.threadpilot.invoice.SupplierInvoiceService;
import com.threadpilot.organization.Organization;
import com.threadpilot.product.Product;
import com.threadpilot.product.ProductRepository;
import com.threadpilot.product.ProductVariant;
import com.threadpilot.product.ProductVariantRepository;
import com.threadpilot.security.TenantContext;
import com.threadpilot.storage.StorageService;
import com.threadpilot.supplier.Supplier;
import com.threadpilot.supplier.SupplierRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class OcrService {

    private final OcrProviderFactory ocrProviderFactory;
    private final StorageService storageService;
    private final SupplierInvoiceRepository invoiceRepository;
    private final SupplierInvoiceItemRepository itemRepository;
    private final SupplierInvoiceService invoiceService;
    private final SupplierRepository supplierRepository;
    private final ProductRepository productRepository;
    private final ProductVariantRepository variantRepository;
    private final ObjectMapper objectMapper;

    @Transactional
    public OcrProcessingResult uploadAndProcess(MultipartFile file) {
        return uploadAndProcess(file, null);
    }

    @Transactional
    public OcrProcessingResult uploadAndProcess(MultipartFile file, UUID supplierId) {
        UUID orgId = TenantContext.requireTenantId();
        Organization organization = new Organization();
        organization.setId(orgId);

        Supplier supplier = null;
        if (supplierId != null) {
            supplier = supplierRepository.findById(supplierId)
                    .filter(s -> s.getOrganization().getId().equals(orgId))
                    .orElse(null);
        }

        if (supplier == null) {
            supplier = supplierRepository.findByOrganizationId(orgId, org.springframework.data.domain.PageRequest.of(0, 1))
                    .stream().findFirst().orElse(null);
        }

        if (supplier == null) {
            supplier = Supplier.builder()
                    .name("Unassigned OCR Supplier")
                    .status(com.threadpilot.supplier.SupplierStatus.ACTIVE)
                    .organization(organization)
                    .outstandingAmount(BigDecimal.ZERO)
                    .build();
            supplier = supplierRepository.save(supplier);
        }

        // Store the file
        String fileUrl = storageService.store(file, "invoices/ocr");

        // Create invoice in PROCESSING status with required organization and supplier
        SupplierInvoice invoice = SupplierInvoice.builder()
                .invoiceNumber("OCR-" + System.currentTimeMillis())
                .invoiceDate(java.time.LocalDate.now())
                .dueDate(java.time.LocalDate.now().plusDays(30))
                .status(com.threadpilot.invoice.InvoiceStatus.PROCESSING)
                .documentUrl(fileUrl)
                .ocrStatus(com.threadpilot.invoice.OcrStatus.PROCESSING)
                .organization(organization)
                .supplier(supplier)
                .subtotal(BigDecimal.ZERO)
                .taxAmount(BigDecimal.ZERO)
                .discountAmount(BigDecimal.ZERO)
                .totalAmount(BigDecimal.ZERO)
                .paidAmount(BigDecimal.ZERO)
                .outstandingAmount(BigDecimal.ZERO)
                .build();
        invoice = invoiceRepository.save(invoice);

        // Process with OCR
        OcrProvider provider = ocrProviderFactory.getDefaultProvider();
        OcrResult result = provider.process(file);

        // Update invoice with OCR results
        invoice.setOcrStatus(result.isSuccess() ? com.threadpilot.invoice.OcrStatus.COMPLETED : com.threadpilot.invoice.OcrStatus.FAILED);
        invoice.setOcrConfidence(result.getConfidence());
        invoice.setOcrRawData(toJson(result));
        invoiceRepository.save(invoice);

        if (!result.isSuccess()) {
            throw new BusinessException("OCR_FAILED", "OCR processing failed: " + result.getError());
        }

        log.info("OCR processed invoice: {} with confidence: {}", invoice.getId(), result.getConfidence());

        return OcrProcessingResult.builder()
                .invoiceId(invoice.getId())
                .ocrResult(result)
                .documentUrl(fileUrl)
                .build();
    }

    @Transactional
    public OcrProcessingResult uploadAndProcessForInvoice(UUID invoiceId, MultipartFile file) {
        SupplierInvoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new BusinessException("RESOURCE_NOT_FOUND", "Invoice not found"));

        UUID orgId = TenantContext.requireTenantId();
        if (!invoice.getOrganization().getId().equals(orgId)) {
            throw new BusinessException("ACCESS_DENIED", "Invoice not accessible");
        }

        // Only allow document upload for invoices in DRAFT or PROCESSING status
        if (invoice.getStatus() != com.threadpilot.invoice.InvoiceStatus.DRAFT &&
                invoice.getStatus() != com.threadpilot.invoice.InvoiceStatus.PROCESSING) {
            throw new BusinessException("INVALID_STATE", "Cannot upload document for invoice in status: " + invoice.getStatus());
        }

        // Store the file
        String fileUrl = storageService.store(file, "invoices/ocr");

        // Update invoice with document
        invoice.setDocumentUrl(fileUrl);
        invoice.setOcrStatus(com.threadpilot.invoice.OcrStatus.PROCESSING);
        invoice.setStatus(com.threadpilot.invoice.InvoiceStatus.PROCESSING);
        invoiceRepository.save(invoice);

        // Process with OCR
        OcrProvider provider = ocrProviderFactory.getDefaultProvider();
        OcrResult result = provider.process(file);

        // Update invoice with OCR results
        invoice.setOcrStatus(result.isSuccess() ? com.threadpilot.invoice.OcrStatus.COMPLETED : com.threadpilot.invoice.OcrStatus.FAILED);
        invoice.setOcrConfidence(result.getConfidence());
        invoice.setOcrRawData(toJson(result));
        invoiceRepository.save(invoice);

        if (!result.isSuccess()) {
            throw new BusinessException("OCR_FAILED", "OCR processing failed: " + result.getError());
        }

        log.info("OCR processed document for invoice: {} with confidence: {}", invoice.getId(), result.getConfidence());

        return OcrProcessingResult.builder()
                .invoiceId(invoice.getId())
                .ocrResult(result)
                .documentUrl(fileUrl)
                .build();
    }

    @Transactional
    public OcrProcessingResult reprocessOcrForInvoice(UUID invoiceId) {
        SupplierInvoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new BusinessException("RESOURCE_NOT_FOUND", "Invoice not found"));

        UUID orgId = TenantContext.requireTenantId();
        if (!invoice.getOrganization().getId().equals(orgId)) {
            throw new BusinessException("ACCESS_DENIED", "Invoice not accessible");
        }

        if (invoice.getDocumentUrl() == null || invoice.getDocumentUrl().isEmpty()) {
            throw new BusinessException("NO_DOCUMENT", "No document attached to this invoice");
        }

        // Reset OCR status to processing
        invoice.setOcrStatus(com.threadpilot.invoice.OcrStatus.PROCESSING);
        invoiceRepository.save(invoice);

        // Retrieve and process the document
        byte[] fileData = storageService.retrieve(invoice.getDocumentUrl());
        String mimeType = guessMimeType(invoice.getDocumentUrl());

        OcrProvider provider = ocrProviderFactory.getDefaultProvider();
        OcrResult result = provider.process(fileData, mimeType);

        // Update invoice with OCR results
        invoice.setOcrStatus(result.isSuccess() ? com.threadpilot.invoice.OcrStatus.COMPLETED : com.threadpilot.invoice.OcrStatus.FAILED);
        invoice.setOcrConfidence(result.getConfidence());
        invoice.setOcrRawData(toJson(result));
        invoiceRepository.save(invoice);

        if (!result.isSuccess()) {
            throw new BusinessException("OCR_FAILED", "OCR reprocessing failed: " + result.getError());
        }

        log.info("OCR reprocessed document for invoice: {} with confidence: {}", invoice.getId(), result.getConfidence());

        return OcrProcessingResult.builder()
                .invoiceId(invoice.getId())
                .ocrResult(result)
                .documentUrl(invoice.getDocumentUrl())
                .build();
    }

    private String guessMimeType(String path) {
        if (path.endsWith(".pdf")) return "application/pdf";
        if (path.endsWith(".jpg") || path.endsWith(".jpeg")) return "image/jpeg";
        if (path.endsWith(".png")) return "image/png";
        return "application/octet-stream";
    }

    @Transactional(readOnly = true)
    public OcrResult getOcrResult(UUID invoiceId) {
        SupplierInvoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new BusinessException("RESOURCE_NOT_FOUND", "Invoice not found"));

        UUID orgId = TenantContext.getOrganizationId();
        if (orgId != null && invoice.getOrganization() != null && !invoice.getOrganization().getId().equals(orgId)) {
            throw new BusinessException("ACCESS_DENIED", "Invoice not accessible");
        }

        if (invoice.getOcrRawData() == null || invoice.getOcrRawData().isBlank()) {
            throw new BusinessException("NO_OCR_DATA", "No OCR data available for this invoice");
        }

        try {
            JsonNode rootNode = objectMapper.readTree(invoice.getOcrRawData());
            if (rootNode.isTextual()) {
                rootNode = objectMapper.readTree(rootNode.asText());
            }

            // Case 1: Full OcrResult structure (contains "structuredData" field)
            if (rootNode.hasNonNull("structuredData")) {
                OcrResult result = objectMapper.treeToValue(rootNode, OcrResult.class);
                if (result.getConfidence() == null && invoice.getOcrConfidence() != null) {
                    result.setConfidence(invoice.getOcrConfidence());
                }
                if (!result.isSuccess() && (invoice.getOcrStatus() == com.threadpilot.invoice.OcrStatus.COMPLETED ||
                        invoice.getOcrStatus() == com.threadpilot.invoice.OcrStatus.VERIFIED)) {
                    result.setSuccess(true);
                }
                return result;
            }

            // Case 2: Direct structured data map (legacy records)
            Map<String, Object> structuredData = objectMapper.convertValue(
                    rootNode,
                    new TypeReference<Map<String, Object>>() {}
            );

            List<OcrResult.OcrLineItem> lineItems = null;
            if (rootNode.has("lineItems") && rootNode.get("lineItems").isArray()) {
                lineItems = objectMapper.convertValue(
                        rootNode.get("lineItems"),
                        new TypeReference<List<OcrResult.OcrLineItem>>() {}
                );
            } else if (structuredData != null && structuredData.get("lineItems") instanceof List<?> list && !list.isEmpty()) {
                lineItems = objectMapper.convertValue(
                        list,
                        new TypeReference<List<OcrResult.OcrLineItem>>() {}
                );
            }

            Double confidence = invoice.getOcrConfidence() != null ? invoice.getOcrConfidence() : 0.9;
            boolean success = invoice.getOcrStatus() == com.threadpilot.invoice.OcrStatus.COMPLETED ||
                              invoice.getOcrStatus() == com.threadpilot.invoice.OcrStatus.VERIFIED;
            String rawText = rootNode.hasNonNull("rawText") ? rootNode.get("rawText").asText() : null;

            return OcrResult.builder()
                    .success(success)
                    .confidence(confidence)
                    .rawText(rawText)
                    .structuredData(structuredData)
                    .lineItems(lineItems)
                    .build();
        } catch (Exception e) {
            log.error("Failed to parse OCR data for invoice {}: {}", invoiceId, e.getMessage(), e);
            throw new BusinessException("PARSE_ERROR", "Failed to parse OCR data: " + e.getMessage());
        }
    }

    @Transactional
    public SupplierInvoice verifyAndCommit(UUID invoiceId, SupplierInvoice verifiedInvoice) {
        SupplierInvoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new BusinessException("RESOURCE_NOT_FOUND", "Invoice not found"));

        if (invoice.getOcrStatus() != com.threadpilot.invoice.OcrStatus.COMPLETED &&
                invoice.getOcrStatus() != com.threadpilot.invoice.OcrStatus.VERIFIED) {
            throw new BusinessException("INVALID_STATE", "Invoice OCR not completed");
        }

        UUID orgId = TenantContext.requireTenantId();

        // Validate and set supplier
        if (verifiedInvoice.getSupplier() == null || verifiedInvoice.getSupplier().getId() == null) {
            throw new BusinessException("VALIDATION_ERROR", "Supplier is required");
        }
        Supplier supplier = supplierRepository.findById(verifiedInvoice.getSupplier().getId())
                .filter(s -> s.getOrganization().getId().equals(orgId))
                .orElseThrow(() -> new BusinessException("VALIDATION_ERROR", "Supplier not found or not accessible"));

        // Update invoice with verified data - note: keep status as DRAFT/PROCESSING so verify() can perform the transition
        invoice.setInvoiceNumber(verifiedInvoice.getInvoiceNumber());
        invoice.setInvoiceDate(verifiedInvoice.getInvoiceDate());
        invoice.setDueDate(verifiedInvoice.getDueDate());
        invoice.setSupplier(supplier);
        invoice.setNotes(verifiedInvoice.getNotes());
        if (verifiedInvoice.getDocumentUrl() != null && !verifiedInvoice.getDocumentUrl().isBlank()) {
            invoice.setDocumentUrl(verifiedInvoice.getDocumentUrl());
        }
        invoice.setOcrStatus(com.threadpilot.invoice.OcrStatus.VERIFIED);

        // Handle items - create new items from verified invoice
        if (verifiedInvoice.getItems() != null && !verifiedInvoice.getItems().isEmpty()) {
            // Clear existing items
            itemRepository.deleteAll(invoice.getItems());
            invoice.getItems().clear();

            for (SupplierInvoiceItem item : verifiedInvoice.getItems()) {
                SupplierInvoiceItem newItem = SupplierInvoiceItem.builder()
                        .quantity(item.getQuantity())
                        .unitPrice(item.getUnitPrice())
                        .taxRate(item.getTaxRate())
                        .discountRate(item.getDiscountRate())
                        .description(item.getDescription())
                        .invoice(invoice)
                        .build();
                Organization org = new Organization();
                org.setId(orgId);
                newItem.setOrganization(org);

                // Handle product/variant association
                if (item.getProduct() != null && item.getProduct().getId() != null) {
                    Product product = productRepository.findById(item.getProduct().getId())
                            .filter(p -> p.getOrganization().getId().equals(orgId))
                            .orElseThrow(() -> new BusinessException("VALIDATION_ERROR", "Product not found or not accessible"));
                    newItem.setProduct(product);
                }
                if (item.getVariant() != null && item.getVariant().getId() != null) {
                    ProductVariant variant = variantRepository.findById(item.getVariant().getId())
                            .filter(v -> v.getOrganization().getId().equals(orgId))
                            .orElseThrow(() -> new BusinessException("VALIDATION_ERROR", "Product variant not found or not accessible"));
                    newItem.setVariant(variant);
                }

                newItem.calculateLineTotal();
                itemRepository.save(newItem);
                invoice.getItems().add(newItem);
            }
        }

        // Recalculate totals
        invoiceService.recalculateInvoiceTotals(invoice);

        // The invoice service will handle inventory updates and supplier balance when verified
        return invoiceService.verify(invoice.getId());
    }

    private String toJson(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            log.error("Failed to serialize object to JSON: {}", e.getMessage(), e);
            return "{}";
        }
    }

    @lombok.Builder
    @lombok.Data
    public static class OcrProcessingResult {
        private UUID invoiceId;
        private OcrResult ocrResult;
        private String documentUrl;
    }
}
