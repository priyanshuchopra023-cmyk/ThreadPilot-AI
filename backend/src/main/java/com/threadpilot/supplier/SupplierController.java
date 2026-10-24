package com.threadpilot.supplier;

import com.threadpilot.common.dto.ApiResponse;
import com.threadpilot.common.dto.PageResponse;
import com.threadpilot.common.dto.PaginationRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/suppliers")
@RequiredArgsConstructor
public class SupplierController {

    private final SupplierService supplierService;

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<Supplier>>> getAll(PaginationRequest request) {
        PageResponse<Supplier> page = supplierService.getAll(request);
        return ResponseEntity.ok(ApiResponse.success(page));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<PageResponse<Supplier>>> search(
            @RequestParam String q,
            PaginationRequest request
    ) {
        PageResponse<Supplier> page = supplierService.search(q, request);
        return ResponseEntity.ok(ApiResponse.success(page));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Supplier>> getById(@PathVariable UUID id) {
        Supplier supplier = supplierService.getById(id);
        return ResponseEntity.ok(ApiResponse.success(supplier));
    }

    @GetMapping("/outstanding")
    public ResponseEntity<ApiResponse<List<Supplier>>> getWithOutstanding() {
        List<Supplier> suppliers = supplierService.getWithOutstanding();
        return ResponseEntity.ok(ApiResponse.success(suppliers));
    }

    @GetMapping("/outstanding/total")
    public ResponseEntity<ApiResponse<BigDecimal>> getTotalOutstanding() {
        BigDecimal total = supplierService.getTotalOutstanding();
        return ResponseEntity.ok(ApiResponse.success(total));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<Supplier>> create(@RequestBody Supplier supplier) {
        Supplier created = supplierService.create(supplier);
        return ResponseEntity.ok(ApiResponse.success(created, "Supplier created successfully"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<Supplier>> update(@PathVariable UUID id, @RequestBody Supplier supplier) {
        Supplier updated = supplierService.update(id, supplier);
        return ResponseEntity.ok(ApiResponse.success(updated, "Supplier updated successfully"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        supplierService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Supplier deleted successfully"));
    }
}

