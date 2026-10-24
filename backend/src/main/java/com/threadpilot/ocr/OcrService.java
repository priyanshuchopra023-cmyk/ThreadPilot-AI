package com.threadpilot.ocr;

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

@Transactional
    public OcrProcessingResult uploadAndProcess(MultipartFile file) {
        // Store the file
        String fileUrl = storageService.store(file, "invoices/ocr");

        // Create invoice in PROCESSING status
        SupplierInvoice invoice = SupplierInvoice.builder()
                .invoiceNumber("OCR-" + System.currentTimeMillis())
                .invoiceDate(java.time.LocalDate.now())
                .dueDate(java.time.LocalDate.now().plusDays(30))
                .status(com.threadpilot.invoice.InvoiceStatus.PROCESSING)
                .documentUrl(fileUrl)
                .ocrStatus(com.threadpilot.invoice.OcrStatus.PROCESSING)
                .build();
        invoice = invoiceRepository.save(invoice);

        // Process with OCR
        OcrProvider provider = ocrProviderFactory.getDefaultProvider();
        OcrResult result = provider.process(file);

        // Update invoice with OCR results
        invoice.setOcrStatus(result.isSuccess() ? com.threadpilot.invoice.OcrStatus.COMPLETED : com.threadpilot.invoice.OcrStatus.FAILED);
        invoice.setOcrConfidence(result.getConfidence());
        invoice.setOcrRawData(toJson(result.getStructuredData()));
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
        invoice.setOcrRawData(toJson(result.getStructuredData()));
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
        invoice.setOcrRawData(toJson(result.getStructuredData()));
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

        if (invoice.getOcrRawData() == null) {
            throw new BusinessException("NO_OCR_DATA", "No OCR data available for this invoice");
        }

        try {
            return new com.fasterxml.jackson.databind.ObjectMapper()
                    .readValue(invoice.getOcrRawData(), OcrResult.class);
        } catch (Exception e) {
            throw new BusinessException("PARSE_ERROR", "Failed to parse OCR data");
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

        // Update invoice with verified data
        invoice.setInvoiceNumber(verifiedInvoice.getInvoiceNumber());
        invoice.setInvoiceDate(verifiedInvoice.getInvoiceDate());
        invoice.setDueDate(verifiedInvoice.getDueDate());
        invoice.setSupplier(supplier);
        invoice.setNotes(verifiedInvoice.getNotes());
        invoice.setDocumentUrl(verifiedInvoice.getDocumentUrl());
        invoice.setStatus(com.threadpilot.invoice.InvoiceStatus.VERIFIED);
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

        // The invoice service will handle inventory updates when verified
        return invoiceService.verify(invoice.getId());
    }

    private String toJson(Object obj) {
        try {
            return new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(obj);
        } catch (Exception e) {
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

