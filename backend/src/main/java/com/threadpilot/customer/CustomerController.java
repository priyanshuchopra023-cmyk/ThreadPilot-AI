package com.threadpilot.customer;

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
@RequestMapping("/customers")
@RequiredArgsConstructor
public class CustomerController {

    private final CustomerService customerService;

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<Customer>>> getAll(PaginationRequest request) {
        PageResponse<Customer> page = customerService.getAll(request);
        return ResponseEntity.ok(ApiResponse.success(page));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<PageResponse<Customer>>> search(
            @RequestParam String q,
            PaginationRequest request
    ) {
        PageResponse<Customer> page = customerService.search(q, request);
        return ResponseEntity.ok(ApiResponse.success(page));
    }

@GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Customer>> getById(@PathVariable UUID id) {
        Customer customer = customerService.getById(id);
        return ResponseEntity.ok(ApiResponse.success(customer));
    }

    @GetMapping("/{id}/outstanding")
    public ResponseEntity<ApiResponse<OutstandingResponse>> getOutstanding(@PathVariable UUID id) {
        Customer customer = customerService.getById(id);
        OutstandingResponse response = OutstandingResponse.builder()
                .outstandingAmount(customer.getOutstandingAmount().doubleValue())
                .build();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @lombok.Builder
    @lombok.Data
    public static class OutstandingResponse {
        private double outstandingAmount;
    }

    @GetMapping("/outstanding")
    public ResponseEntity<ApiResponse<List<Customer>>> getWithOutstanding() {
        List<Customer> customers = customerService.getWithOutstanding();
        return ResponseEntity.ok(ApiResponse.success(customers));
    }

    @GetMapping("/outstanding/above")
    public ResponseEntity<ApiResponse<List<Customer>>> getWithOutstandingAboveThreshold(
            @RequestParam BigDecimal threshold
    ) {
        List<Customer> customers = customerService.getWithOutstandingAboveThreshold(threshold);
        return ResponseEntity.ok(ApiResponse.success(customers));
    }

    @GetMapping("/credit-limit/exceeded")
    public ResponseEntity<ApiResponse<List<Customer>>> getExceedingCreditLimit() {
        List<Customer> customers = customerService.getExceedingCreditLimit();
        return ResponseEntity.ok(ApiResponse.success(customers));
    }

    @GetMapping("/outstanding/total")
    public ResponseEntity<ApiResponse<BigDecimal>> getTotalOutstanding() {
        BigDecimal total = customerService.getTotalOutstanding();
        return ResponseEntity.ok(ApiResponse.success(total));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER', 'SALES')")
    public ResponseEntity<ApiResponse<Customer>> create(@RequestBody Customer customer) {
        Customer created = customerService.create(customer);
        return ResponseEntity.ok(ApiResponse.success(created, "Customer created successfully"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER', 'SALES')")
    public ResponseEntity<ApiResponse<Customer>> update(@PathVariable UUID id, @RequestBody Customer customer) {
        Customer updated = customerService.update(id, customer);
        return ResponseEntity.ok(ApiResponse.success(updated, "Customer updated successfully"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        customerService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Customer deleted successfully"));
    }
}

