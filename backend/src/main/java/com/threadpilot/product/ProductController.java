package com.threadpilot.product;

import com.threadpilot.common.dto.ApiResponse;
import com.threadpilot.common.dto.PageResponse;
import com.threadpilot.common.dto.PaginationRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<Product>>> getAll(PaginationRequest request) {
        PageResponse<Product> page = productService.getAll(request);
        return ResponseEntity.ok(ApiResponse.success(page));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<PageResponse<Product>>> search(
            @RequestParam String q,
            PaginationRequest request
    ) {
        PageResponse<Product> page = productService.search(q, request);
        return ResponseEntity.ok(ApiResponse.success(page));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Product>> getById(@PathVariable UUID id) {
        Product product = productService.getById(id);
        return ResponseEntity.ok(ApiResponse.success(product));
    }

    @GetMapping("/sku/{sku}")
    public ResponseEntity<ApiResponse<Product>> getBySku(@PathVariable String sku) {
        Product product = productService.getBySku(sku);
        return ResponseEntity.ok(ApiResponse.success(product));
    }

    @GetMapping("/category/{category}")
    public ResponseEntity<ApiResponse<List<Product>>> getByCategory(@PathVariable String category) {
        List<Product> products = productService.getByCategory(category);
        return ResponseEntity.ok(ApiResponse.success(products));
    }

    @GetMapping("/brand/{brand}")
    public ResponseEntity<ApiResponse<List<Product>>> getByBrand(@PathVariable String brand) {
        List<Product> products = productService.getByBrand(brand);
        return ResponseEntity.ok(ApiResponse.success(products));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER', 'INVENTORY_MANAGER')")
    public ResponseEntity<ApiResponse<Product>> create(@RequestBody Product product) {
        Product created = productService.create(product);
        return ResponseEntity.ok(ApiResponse.success(created, "Product created successfully"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER', 'INVENTORY_MANAGER')")
    public ResponseEntity<ApiResponse<Product>> update(@PathVariable UUID id, @RequestBody Product product) {
        Product updated = productService.update(id, product);
        return ResponseEntity.ok(ApiResponse.success(updated, "Product updated successfully"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        productService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Product deleted successfully"));
    }

    // Variant endpoints
    @GetMapping("/{productId}/variants")
    public ResponseEntity<ApiResponse<PageResponse<ProductVariant>>> getVariants(
            @PathVariable UUID productId,
            PaginationRequest request
    ) {
        PageResponse<ProductVariant> page = productService.getVariants(productId, request);
        return ResponseEntity.ok(ApiResponse.success(page));
    }

    @GetMapping("/variants/{id}")
    public ResponseEntity<ApiResponse<ProductVariant>> getVariantById(@PathVariable UUID id) {
        ProductVariant variant = productService.getVariantById(id);
        return ResponseEntity.ok(ApiResponse.success(variant));
    }

    @PostMapping("/{productId}/variants")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER', 'INVENTORY_MANAGER')")
    public ResponseEntity<ApiResponse<ProductVariant>> createVariant(
            @PathVariable UUID productId,
            @RequestBody ProductVariant variant
    ) {
        ProductVariant created = productService.createVariant(productId, variant);
        return ResponseEntity.ok(ApiResponse.success(created, "Variant created successfully"));
    }

    @PutMapping("/variants/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER', 'INVENTORY_MANAGER')")
    public ResponseEntity<ApiResponse<ProductVariant>> updateVariant(@PathVariable UUID id, @RequestBody ProductVariant variant) {
        ProductVariant updated = productService.updateVariant(id, variant);
        return ResponseEntity.ok(ApiResponse.success(updated, "Variant updated successfully"));
    }

    @DeleteMapping("/variants/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteVariant(@PathVariable UUID id) {
        productService.deleteVariant(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Variant deleted successfully"));
    }
}

