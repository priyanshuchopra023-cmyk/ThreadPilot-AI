package com.threadpilot.audit;

import com.threadpilot.common.dto.ApiResponse;
import com.threadpilot.common.dto.PageResponse;
import com.threadpilot.common.dto.PaginationRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.UUID;

@RestController
@RequestMapping("/api/audit")
@RequiredArgsConstructor
public class AuditController {

    private final AuditService auditService;

    @GetMapping
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'ACCOUNTANT')")
    public ResponseEntity<ApiResponse<PageResponse<AuditLog>>> getAll(PaginationRequest request) {
        PageResponse<AuditLog> page = auditService.getAll(request);
        return ResponseEntity.ok(ApiResponse.success(page));
    }

    @GetMapping("/entity")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'ACCOUNTANT')")
    public ResponseEntity<ApiResponse<PageResponse<AuditLog>>> getByEntity(
            @RequestParam String entityType,
            @RequestParam UUID entityId,
            PaginationRequest request
    ) {
        PageResponse<AuditLog> page = auditService.getByEntity(entityType, entityId, request);
        return ResponseEntity.ok(ApiResponse.success(page));
    }

    @GetMapping("/action")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'ACCOUNTANT')")
    public ResponseEntity<ApiResponse<PageResponse<AuditLog>>> getByAction(
            @RequestParam AuditAction action,
            PaginationRequest request
    ) {
        PageResponse<AuditLog> page = auditService.getByAction(action, request);
        return ResponseEntity.ok(ApiResponse.success(page));
    }

    @GetMapping("/user/{userId}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'ACCOUNTANT')")
    public ResponseEntity<ApiResponse<PageResponse<AuditLog>>> getByUser(
            @PathVariable UUID userId,
            PaginationRequest request
    ) {
        PageResponse<AuditLog> page = auditService.getByUser(userId, request);
        return ResponseEntity.ok(ApiResponse.success(page));
    }

    @GetMapping("/date-range")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'ACCOUNTANT')")
    public ResponseEntity<ApiResponse<PageResponse<AuditLog>>> getByDateRange(
            @RequestParam Instant start,
            @RequestParam Instant end,
            PaginationRequest request
    ) {
        PageResponse<AuditLog> page = auditService.getByDateRange(start, end, request);
        return ResponseEntity.ok(ApiResponse.success(page));
    }

    @GetMapping("/correlation/{correlationId}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'ACCOUNTANT')")
    public ResponseEntity<ApiResponse<PageResponse<AuditLog>>> getByCorrelationId(
            @PathVariable UUID correlationId,
            PaginationRequest request
    ) {
        PageResponse<AuditLog> page = auditService.getByCorrelationId(correlationId, request);
        return ResponseEntity.ok(ApiResponse.success(page));
    }
}

