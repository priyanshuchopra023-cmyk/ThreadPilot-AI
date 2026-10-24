package com.threadpilot.sale;

import com.threadpilot.common.dto.ApiResponse;
import com.threadpilot.common.dto.PageResponse;
import com.threadpilot.common.dto.PaginationRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/sales")
@RequiredArgsConstructor
public class SaleController {

    private final SaleService saleService;

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<Sale>>> getAll(PaginationRequest request) {
        PageResponse<Sale> page = saleService.getAll(request);
        return ResponseEntity.ok(ApiResponse.success(page));
    }

    @GetMapping("/customer/{customerId}")
    public ResponseEntity<ApiResponse<PageResponse<Sale>>> getByCustomer(
            @PathVariable UUID customerId,
            PaginationRequest request
    ) {
        PageResponse<Sale> page = saleService.getByCustomer(customerId, request);
        return ResponseEntity.ok(ApiResponse.success(page));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Sale>> getById(@PathVariable UUID id) {
        Sale sale = saleService.getById(id);
        return ResponseEntity.ok(ApiResponse.success(sale));
    }

    @GetMapping("/date-range")
    public ResponseEntity<ApiResponse<List<Sale>>> getByDateRange(
            @RequestParam LocalDate start,
            @RequestParam LocalDate end
    ) {
        List<Sale> sales = saleService.getByDateRange(start, end);
        return ResponseEntity.ok(ApiResponse.success(sales));
    }

    @GetMapping("/revenue")
    public ResponseEntity<ApiResponse<BigDecimal>> getTotalRevenue(
            @RequestParam LocalDate start,
            @RequestParam LocalDate end
    ) {
        BigDecimal revenue = saleService.getTotalRevenue(start, end);
        return ResponseEntity.ok(ApiResponse.success(revenue));
    }

    @GetMapping("/gross-profit")
    public ResponseEntity<ApiResponse<BigDecimal>> getTotalGrossProfit(
            @RequestParam LocalDate start,
            @RequestParam LocalDate end
    ) {
        BigDecimal profit = saleService.getTotalGrossProfit(start, end);
        return ResponseEntity.ok(ApiResponse.success(profit));
    }

    @PostMapping("/from-order/{orderId}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER', 'SALES')")
    public ResponseEntity<ApiResponse<Sale>> createFromOrder(@PathVariable UUID orderId) {
        Sale sale = saleService.createFromOrder(orderId);
        return ResponseEntity.ok(ApiResponse.success(sale, "Sale created successfully"));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER', 'SALES')")
    public ResponseEntity<ApiResponse<Sale>> create(@RequestBody Sale sale) {
        Sale created = saleService.create(sale);
        return ResponseEntity.ok(ApiResponse.success(created, "Sale created successfully"));
    }

    @PostMapping("/{id}/items")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER', 'SALES')")
    public ResponseEntity<ApiResponse<Sale>> addItem(@PathVariable UUID id, @RequestBody SaleItem item) {
        Sale sale = saleService.addItem(id, item);
        return ResponseEntity.ok(ApiResponse.success(sale, "Item added successfully"));
    }
}

