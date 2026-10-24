package com.threadpilot.alert;

import com.threadpilot.common.dto.ApiResponse;
import com.threadpilot.common.dto.PageResponse;
import com.threadpilot.common.dto.PaginationRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/alerts")
@RequiredArgsConstructor
public class AlertController {

    private final AlertService alertService;

@GetMapping
    public ResponseEntity<ApiResponse<PageResponse<Alert>>> getAll(PaginationRequest request,
                                                                   @RequestParam(required = false) String status,
                                                                   @RequestParam(required = false) String severity) {
        PageResponse<Alert> page = alertService.getAll(request, status, severity);
        return ResponseEntity.ok(ApiResponse.success(page));
    }

    @GetMapping("/unread")
    public ResponseEntity<ApiResponse<PageResponse<Alert>>> getUnread(PaginationRequest request) {
        PageResponse<Alert> page = alertService.getUnread(request);
        return ResponseEntity.ok(ApiResponse.success(page));
    }

    @GetMapping("/my-unread")
    public ResponseEntity<ApiResponse<List<Alert>>> getMyUnread() {
        List<Alert> alerts = alertService.getMyUnreadAlerts();
        return ResponseEntity.ok(ApiResponse.success(alerts));
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Alert>> markAsRead(@PathVariable UUID id) {
        Alert alert = alertService.markAsRead(id);
        return ResponseEntity.ok(ApiResponse.success(alert, "Alert marked as read"));
    }

    @PostMapping("/{id}/dismiss")
    public ResponseEntity<ApiResponse<Alert>> dismiss(@PathVariable UUID id) {
        Alert alert = alertService.dismiss(id);
        return ResponseEntity.ok(ApiResponse.success(alert, "Alert dismissed"));
    }

    @PostMapping("/{id}/resolve")
    public ResponseEntity<ApiResponse<Alert>> resolve(@PathVariable UUID id) {
        Alert alert = alertService.resolve(id);
        return ResponseEntity.ok(ApiResponse.success(alert, "Alert resolved"));
    }

    @PostMapping("/read-all")
    public ResponseEntity<ApiResponse<Long>> markAllAsRead() {
        long count = alertService.markAllAsRead();
        return ResponseEntity.ok(ApiResponse.success(count, "All alerts marked as read"));
    }

    @PostMapping("/generate")
    public ResponseEntity<ApiResponse<Void>> generateAlerts() {
        alertService.generateDailyAlerts();
        return ResponseEntity.ok(ApiResponse.success(null, "Alerts generated"));
    }
}

