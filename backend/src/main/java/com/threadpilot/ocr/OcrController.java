package com.threadpilot.ocr;

import com.threadpilot.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@RestController
@RequestMapping("/ocr")
@RequiredArgsConstructor
public class OcrController {

    private final OcrService ocrService;

    @PostMapping("/upload")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER', 'ACCOUNTANT')")
    public ResponseEntity<ApiResponse<OcrService.OcrProcessingResult>> uploadAndProcess(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "supplierId", required = false) UUID supplierId
    ) {
        OcrService.OcrProcessingResult result = ocrService.uploadAndProcess(file, supplierId);
        return ResponseEntity.ok(ApiResponse.success(result, "Invoice uploaded and processed"));
    }

    @GetMapping("/{invoiceId}")
    public ResponseEntity<ApiResponse<OcrResult>> getOcrResult(@PathVariable UUID invoiceId) {
        OcrResult result = ocrService.getOcrResult(invoiceId);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PostMapping("/{invoiceId}/verify")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER', 'ACCOUNTANT')")
    public ResponseEntity<ApiResponse<com.threadpilot.invoice.SupplierInvoice>> verifyAndCommit(
            @PathVariable UUID invoiceId,
            @RequestBody com.threadpilot.invoice.SupplierInvoice verifiedInvoice
    ) {
        com.threadpilot.invoice.SupplierInvoice invoice = ocrService.verifyAndCommit(invoiceId, verifiedInvoice);
        return ResponseEntity.ok(ApiResponse.success(invoice, "Invoice verified and committed"));
    }
}
