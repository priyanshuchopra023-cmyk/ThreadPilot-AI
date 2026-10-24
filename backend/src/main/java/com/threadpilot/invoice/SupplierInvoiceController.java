package com.threadpilot.invoice;

import com.threadpilot.common.dto.ApiResponse;
import com.threadpilot.common.dto.PageResponse;
import com.threadpilot.common.dto.PaginationRequest;
import com.threadpilot.ocr.OcrResult;
import com.threadpilot.ocr.OcrService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/invoices")
@RequiredArgsConstructor
public class SupplierInvoiceController {

    private final SupplierInvoiceService invoiceService;
    private final OcrService ocrService;

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<SupplierInvoice>>> getAll(PaginationRequest request) {
        PageResponse<SupplierInvoice> page = invoiceService.getAll(request);
        return ResponseEntity.ok(ApiResponse.success(page));
    }

    @GetMapping("/supplier/{supplierId}")
    public ResponseEntity<ApiResponse<PageResponse<SupplierInvoice>>> getBySupplier(
            @PathVariable UUID supplierId,
            PaginationRequest request
    ) {
        PageResponse<SupplierInvoice> page = invoiceService.getBySupplier(supplierId, request);
        return ResponseEntity.ok(ApiResponse.success(page));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SupplierInvoice>> getById(@PathVariable UUID id) {
        SupplierInvoice invoice = invoiceService.getById(id);
        return ResponseEntity.ok(ApiResponse.success(invoice));
    }

    @GetMapping("/overdue")
    public ResponseEntity<ApiResponse<List<SupplierInvoice>>> getOverdue() {
        List<SupplierInvoice> invoices = invoiceService.getOverdue();
        return ResponseEntity.ok(ApiResponse.success(invoices));
    }

    @GetMapping("/due-soon")
    public ResponseEntity<ApiResponse<List<SupplierInvoice>>> getDueSoon(@RequestParam(defaultValue = "7") int days) {
        List<SupplierInvoice> invoices = invoiceService.getDueSoon(days);
        return ResponseEntity.ok(ApiResponse.success(invoices));
    }

    @GetMapping("/outstanding/total")
    public ResponseEntity<ApiResponse<BigDecimal>> getTotalOutstanding() {
        BigDecimal total = invoiceService.getTotalOutstanding();
        return ResponseEntity.ok(ApiResponse.success(total));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER', 'ACCOUNTANT')")
    public ResponseEntity<ApiResponse<SupplierInvoice>> create(@RequestBody SupplierInvoice invoice) {
        SupplierInvoice created = invoiceService.create(invoice);
        return ResponseEntity.ok(ApiResponse.success(created, "Invoice created successfully"));
    }

    @PostMapping("/{id}/items")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER', 'ACCOUNTANT')")
    public ResponseEntity<ApiResponse<SupplierInvoice>> addItem(@PathVariable UUID id, @RequestBody SupplierInvoiceItem item) {
        SupplierInvoice invoice = invoiceService.addItem(id, item);
        return ResponseEntity.ok(ApiResponse.success(invoice, "Item added successfully"));
    }

    @PostMapping("/{id}/verify")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER', 'ACCOUNTANT')")
    public ResponseEntity<ApiResponse<SupplierInvoice>> verify(@PathVariable UUID id) {
        SupplierInvoice invoice = invoiceService.verify(id);
        return ResponseEntity.ok(ApiResponse.success(invoice, "Invoice verified successfully"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER', 'ACCOUNTANT')")
    public ResponseEntity<ApiResponse<SupplierInvoice>> update(@PathVariable UUID id, @RequestBody SupplierInvoice invoice) {
        SupplierInvoice updated = invoiceService.update(id, invoice);
        return ResponseEntity.ok(ApiResponse.success(updated, "Invoice updated successfully"));
    }

@DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        invoiceService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Invoice deleted successfully"));
    }

    // Frontend-compatible endpoints
    @PostMapping("/{id}/document")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER', 'ACCOUNTANT')")
    public ResponseEntity<ApiResponse<OcrService.OcrProcessingResult>> uploadDocument(
            @PathVariable UUID id,
            @RequestParam("file") MultipartFile file
    ) {
        OcrService.OcrProcessingResult result = ocrService.uploadAndProcessForInvoice(id, file);
        return ResponseEntity.ok(ApiResponse.success(result, "Document uploaded and processed"));
    }

    @PostMapping("/{id}/ocr")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER', 'ACCOUNTANT')")
    public ResponseEntity<ApiResponse<OcrService.OcrProcessingResult>> processOcr(@PathVariable UUID id) {
        OcrService.OcrProcessingResult result = ocrService.reprocessOcrForInvoice(id);
        return ResponseEntity.ok(ApiResponse.success(result, "OCR reprocessing completed"));
    }

    @GetMapping("/{id}/ocr-result")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER', 'ACCOUNTANT')")
    public ResponseEntity<ApiResponse<OcrResult>> getOcrResult(@PathVariable UUID id) {
        OcrResult result = ocrService.getOcrResult(id);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PostMapping("/{id}/verify-ocr")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER', 'ACCOUNTANT')")
    public ResponseEntity<ApiResponse<SupplierInvoice>> verifyOcr(@PathVariable UUID id, @RequestBody SupplierInvoice verifiedInvoice) {
        SupplierInvoice invoice = ocrService.verifyAndCommit(id, verifiedInvoice);
        return ResponseEntity.ok(ApiResponse.success(invoice, "Invoice verified and committed successfully"));
    }
}

