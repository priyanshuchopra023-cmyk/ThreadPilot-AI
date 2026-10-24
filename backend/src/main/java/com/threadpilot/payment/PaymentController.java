package com.threadpilot.payment;

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
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<Payment>>> getAll(PaginationRequest request) {
        PageResponse<Payment> page = paymentService.getAll(request);
        return ResponseEntity.ok(ApiResponse.success(page));
    }

    @GetMapping("/customer/{customerId}")
    public ResponseEntity<ApiResponse<PageResponse<Payment>>> getByCustomer(
            @PathVariable UUID customerId,
            PaginationRequest request
    ) {
        PageResponse<Payment> page = paymentService.getByCustomer(customerId, request);
        return ResponseEntity.ok(ApiResponse.success(page));
    }

    @GetMapping("/supplier/{supplierId}")
    public ResponseEntity<ApiResponse<PageResponse<Payment>>> getBySupplier(
            @PathVariable UUID supplierId,
            PaginationRequest request
    ) {
        PageResponse<Payment> page = paymentService.getBySupplier(supplierId, request);
        return ResponseEntity.ok(ApiResponse.success(page));
    }

@GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Payment>> getById(@PathVariable UUID id) {
        Payment payment = paymentService.getById(id);
        return ResponseEntity.ok(ApiResponse.success(payment));
    }

    // Frontend-compatible endpoints returning arrays instead of paginated responses
    @GetMapping("/customer/{customerId}/list")
    public ResponseEntity<ApiResponse<List<Payment>>> getByCustomerList(@PathVariable UUID customerId) {
        List<Payment> payments = paymentService.getByCustomerList(customerId);
        return ResponseEntity.ok(ApiResponse.success(payments));
    }

    @GetMapping("/supplier/{supplierId}/list")
    public ResponseEntity<ApiResponse<List<Payment>>> getBySupplierList(@PathVariable UUID supplierId) {
        List<Payment> payments = paymentService.getBySupplierList(supplierId);
        return ResponseEntity.ok(ApiResponse.success(payments));
    }

    @GetMapping("/invoice/{invoiceId}")
    public ResponseEntity<ApiResponse<List<Payment>>> getBySupplierInvoice(@PathVariable UUID invoiceId) {
        List<Payment> payments = paymentService.getBySupplierInvoice(invoiceId);
        return ResponseEntity.ok(ApiResponse.success(payments));
    }

    @GetMapping("/order/{orderId}")
    public ResponseEntity<ApiResponse<List<Payment>>> getByCustomerOrder(@PathVariable UUID orderId) {
        List<Payment> payments = paymentService.getByCustomerOrder(orderId);
        return ResponseEntity.ok(ApiResponse.success(payments));
    }

    @GetMapping("/date-range")
    public ResponseEntity<ApiResponse<List<Payment>>> getByDateRange(
            @RequestParam LocalDate start,
            @RequestParam LocalDate end
    ) {
        List<Payment> payments = paymentService.getByDateRange(start, end);
        return ResponseEntity.ok(ApiResponse.success(payments));
    }

    @GetMapping("/customer-payments/total")
    public ResponseEntity<ApiResponse<BigDecimal>> getTotalCustomerPayments(
            @RequestParam LocalDate start,
            @RequestParam LocalDate end
    ) {
        BigDecimal total = paymentService.getTotalCustomerPayments(start, end);
        return ResponseEntity.ok(ApiResponse.success(total));
    }

    @GetMapping("/supplier-payments/total")
    public ResponseEntity<ApiResponse<BigDecimal>> getTotalSupplierPayments(
            @RequestParam LocalDate start,
            @RequestParam LocalDate end
    ) {
        BigDecimal total = paymentService.getTotalSupplierPayments(start, end);
        return ResponseEntity.ok(ApiResponse.success(total));
    }

    @PostMapping("/customer")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER', 'ACCOUNTANT', 'SALES')")
    public ResponseEntity<ApiResponse<Payment>> recordCustomerPayment(@RequestBody Payment payment) {
        Payment recorded = paymentService.recordCustomerPayment(payment);
        return ResponseEntity.ok(ApiResponse.success(recorded, "Customer payment recorded successfully"));
    }

    @PostMapping("/supplier")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER', 'ACCOUNTANT')")
    public ResponseEntity<ApiResponse<Payment>> recordSupplierPayment(@RequestBody Payment payment) {
        Payment recorded = paymentService.recordSupplierPayment(payment);
        return ResponseEntity.ok(ApiResponse.success(recorded, "Supplier payment recorded successfully"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER', 'ACCOUNTANT')")
    public ResponseEntity<ApiResponse<Payment>> update(@PathVariable UUID id, @RequestBody Payment payment) {
        Payment updated = paymentService.update(id, payment);
        return ResponseEntity.ok(ApiResponse.success(updated, "Payment updated successfully"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        paymentService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Payment deleted successfully"));
    }
}

