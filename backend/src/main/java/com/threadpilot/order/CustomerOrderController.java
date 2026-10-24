package com.threadpilot.order;

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
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class CustomerOrderController {

    private final CustomerOrderService orderService;

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<CustomerOrder>>> getAll(PaginationRequest request) {
        PageResponse<CustomerOrder> page = orderService.getAll(request);
        return ResponseEntity.ok(ApiResponse.success(page));
    }

    @GetMapping("/customer/{customerId}")
    public ResponseEntity<ApiResponse<PageResponse<CustomerOrder>>> getByCustomer(
            @PathVariable UUID customerId,
            PaginationRequest request
    ) {
        PageResponse<CustomerOrder> page = orderService.getByCustomer(customerId, request);
        return ResponseEntity.ok(ApiResponse.success(page));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CustomerOrder>> getById(@PathVariable UUID id) {
        CustomerOrder order = orderService.getById(id);
        return ResponseEntity.ok(ApiResponse.success(order));
    }

    @GetMapping("/pending-fulfillment")
    public ResponseEntity<ApiResponse<List<CustomerOrder>>> getPendingFulfillment() {
        List<CustomerOrder> orders = orderService.getPendingFulfillment();
        return ResponseEntity.ok(ApiResponse.success(orders));
    }

    @GetMapping("/outstanding")
    public ResponseEntity<ApiResponse<List<CustomerOrder>>> getWithOutstanding() {
        List<CustomerOrder> orders = orderService.getWithOutstanding();
        return ResponseEntity.ok(ApiResponse.success(orders));
    }

    @GetMapping("/outstanding/total")
    public ResponseEntity<ApiResponse<BigDecimal>> getTotalOutstanding() {
        BigDecimal total = orderService.getTotalOutstanding();
        return ResponseEntity.ok(ApiResponse.success(total));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER', 'SALES')")
    public ResponseEntity<ApiResponse<CustomerOrder>> create(@RequestBody CustomerOrder order) {
        CustomerOrder created = orderService.create(order);
        return ResponseEntity.ok(ApiResponse.success(created, "Order created successfully"));
    }

    @PostMapping("/{id}/items")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER', 'SALES')")
    public ResponseEntity<ApiResponse<CustomerOrder>> addItem(@PathVariable UUID id, @RequestBody CustomerOrderItem item) {
        CustomerOrder order = orderService.addItem(id, item);
        return ResponseEntity.ok(ApiResponse.success(order, "Item added successfully"));
    }

    @PostMapping("/{id}/confirm")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER', 'SALES')")
    public ResponseEntity<ApiResponse<CustomerOrder>> confirm(@PathVariable UUID id) {
        CustomerOrder order = orderService.confirm(id);
        return ResponseEntity.ok(ApiResponse.success(order, "Order confirmed successfully"));
    }

    @PostMapping("/{id}/fulfill")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER', 'SALES')")
    public ResponseEntity<ApiResponse<CustomerOrder>> fulfill(@PathVariable UUID id) {
        CustomerOrder order = orderService.fulfill(id);
        return ResponseEntity.ok(ApiResponse.success(order, "Order fulfilled successfully"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER', 'SALES')")
    public ResponseEntity<ApiResponse<CustomerOrder>> update(@PathVariable UUID id, @RequestBody CustomerOrder order) {
        CustomerOrder updated = orderService.update(id, order);
        return ResponseEntity.ok(ApiResponse.success(updated, "Order updated successfully"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        orderService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Order deleted successfully"));
    }
}

