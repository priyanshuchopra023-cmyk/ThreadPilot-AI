package com.threadpilot.inventory;

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
@RequestMapping("/api/inventory")
@RequiredArgsConstructor
public class InventoryController {

    private final InventoryService inventoryService;

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<Inventory>>> getAll(PaginationRequest request) {
        PageResponse<Inventory> page = inventoryService.getAll(request);
        return ResponseEntity.ok(ApiResponse.success(page));
    }

    @GetMapping("/product/{productId}")
    public ResponseEntity<ApiResponse<Inventory>> getByProductId(@PathVariable UUID productId) {
        Inventory inventory = inventoryService.getByProductId(productId);
        return ResponseEntity.ok(ApiResponse.success(inventory));
    }

    @GetMapping("/variant/{variantId}")
    public ResponseEntity<ApiResponse<Inventory>> getByVariantId(@PathVariable UUID variantId) {
        Inventory inventory = inventoryService.getByVariantId(variantId);
        return ResponseEntity.ok(ApiResponse.success(inventory));
    }

    @GetMapping("/low-stock")
    public ResponseEntity<ApiResponse<List<Inventory>>> getLowStock(@RequestParam(defaultValue = "10") int threshold) {
        List<Inventory> items = inventoryService.getLowStock(threshold);
        return ResponseEntity.ok(ApiResponse.success(items));
    }

    @GetMapping("/out-of-stock")
    public ResponseEntity<ApiResponse<List<Inventory>>> getOutOfStock() {
        List<Inventory> items = inventoryService.getOutOfStock();
        return ResponseEntity.ok(ApiResponse.success(items));
    }

    @GetMapping("/value")
    public ResponseEntity<ApiResponse<BigDecimal>> getTotalValue() {
        BigDecimal value = inventoryService.getTotalInventoryValue();
        return ResponseEntity.ok(ApiResponse.success(value));
    }

    @GetMapping("/movements")
    public ResponseEntity<ApiResponse<PageResponse<StockMovement>>> getMovements(PaginationRequest request) {
        PageResponse<StockMovement> page = inventoryService.getMovements(request);
        return ResponseEntity.ok(ApiResponse.success(page));
    }

    @GetMapping("/movements/product/{productId}")
    public ResponseEntity<ApiResponse<PageResponse<StockMovement>>> getMovementsByProduct(
            @PathVariable UUID productId,
            PaginationRequest request
    ) {
        PageResponse<StockMovement> page = inventoryService.getMovementsByProduct(productId, request);
        return ResponseEntity.ok(ApiResponse.success(page));
    }

    @GetMapping("/movements/variant/{variantId}")
    public ResponseEntity<ApiResponse<PageResponse<StockMovement>>> getMovementsByVariant(
            @PathVariable UUID variantId,
            PaginationRequest request
    ) {
        PageResponse<StockMovement> page = inventoryService.getMovementsByVariant(variantId, request);
        return ResponseEntity.ok(ApiResponse.success(page));
    }

    @PostMapping("/adjust")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER', 'INVENTORY_MANAGER')")
    public ResponseEntity<ApiResponse<StockMovement>> adjustStock(
            @RequestParam UUID productId,
            @RequestParam(required = false) UUID variantId,
            @RequestParam int quantity,
            @RequestParam MovementType type,
            @RequestParam(required = false) String notes,
            @RequestParam(required = false) String referenceType,
            @RequestParam(required = false) UUID referenceId,
            @RequestParam(required = false) String referenceNumber
    ) {
        StockMovement movement = inventoryService.adjustStock(
                productId, variantId, quantity, type, notes, referenceType, referenceId, referenceNumber
        );
        return ResponseEntity.ok(ApiResponse.success(movement, "Stock adjusted successfully"));
    }
}

