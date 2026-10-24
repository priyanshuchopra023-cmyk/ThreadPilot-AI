package com.threadpilot.storage;

import com.threadpilot.common.dto.ApiResponse;
import com.threadpilot.invoice.SupplierInvoice;
import com.threadpilot.invoice.SupplierInvoiceRepository;
import com.threadpilot.organization.Organization;
import com.threadpilot.security.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/storage")
@RequiredArgsConstructor
public class StorageController {

    private final StorageService storageService;
    private final SupplierInvoiceRepository invoiceRepository;

    @PostMapping("/upload")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER', 'ACCOUNTANT')")
    public ResponseEntity<ApiResponse<String>> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam(defaultValue = "uploads") String pathPrefix
    ) {
        String path = storageService.store(file, pathPrefix);
        return ResponseEntity.ok(ApiResponse.success(path, "File uploaded successfully"));
    }

    @GetMapping("/files/{path:.+}")
    public ResponseEntity<Resource> download(@PathVariable String path) {
        UUID orgId = TenantContext.requireTenantId();

        // Verify the file belongs to an invoice in the current organization
        // Path format: invoices/ocr/yyyy/MM/dd/uuid.ext
        Optional<SupplierInvoice> invoiceOpt = invoiceRepository.findByDocumentUrlAndOrganizationId(path, orgId);
        if (invoiceOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        byte[] data;
        try {
            data = storageService.retrieve(path);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }

        ByteArrayResource resource = new ByteArrayResource(data);
        String contentType = guessContentType(path);

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + getFilename(path) + "\"")
                .body(resource);
    }

    @DeleteMapping("/files/{path:.+}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String path) {
        UUID orgId = TenantContext.requireTenantId();
        Optional<SupplierInvoice> invoiceOpt = invoiceRepository.findByDocumentUrlAndOrganizationId(path, orgId);
        if (invoiceOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        storageService.delete(path);
        return ResponseEntity.ok(ApiResponse.success(null, "File deleted successfully"));
    }

    private String guessContentType(String path) {
        if (path.endsWith(".pdf")) return "application/pdf";
        if (path.endsWith(".jpg") || path.endsWith(".jpeg")) return "image/jpeg";
        if (path.endsWith(".png")) return "image/png";
        if (path.endsWith(".txt")) return "text/plain";
        if (path.endsWith(".csv")) return "text/csv";
        return "application/octet-stream";
    }

    private String getFilename(String path) {
        int lastSlash = path.lastIndexOf('/');
        return lastSlash >= 0 ? path.substring(lastSlash + 1) : path;
    }
}