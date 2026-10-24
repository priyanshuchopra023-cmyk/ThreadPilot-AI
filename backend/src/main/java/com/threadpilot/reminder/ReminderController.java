package com.threadpilot.reminder;

import com.threadpilot.common.dto.ApiResponse;
import com.threadpilot.common.dto.PageResponse;
import com.threadpilot.common.dto.PaginationRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/reminders")
@RequiredArgsConstructor
public class ReminderController {

    private final ReminderService reminderService;

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<Reminder>>> getAll(PaginationRequest request) {
        PageResponse<Reminder> page = reminderService.getAll(request);
        return ResponseEntity.ok(ApiResponse.success(page));
    }

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<PageResponse<Reminder>>> getMyReminders(PaginationRequest request) {
        UUID userId = com.threadpilot.security.TenantContext.getUserId();
        PageResponse<Reminder> page = reminderService.getByAssignedUser(userId, request);
        return ResponseEntity.ok(ApiResponse.success(page));
    }

    @GetMapping("/due-today")
    public ResponseEntity<ApiResponse<List<Reminder>>> getDueToday() {
        List<Reminder> reminders = reminderService.getDueToday();
        return ResponseEntity.ok(ApiResponse.success(reminders));
    }

    @GetMapping("/my/due-today")
    public ResponseEntity<ApiResponse<List<Reminder>>> getMyDueToday() {
        UUID userId = com.threadpilot.security.TenantContext.getUserId();
        List<Reminder> reminders = reminderService.getDueTodayForUser(userId);
        return ResponseEntity.ok(ApiResponse.success(reminders));
    }

    @GetMapping("/due-range")
    public ResponseEntity<ApiResponse<List<Reminder>>> getDueInRange(
            @RequestParam LocalDate start,
            @RequestParam LocalDate end
    ) {
        List<Reminder> reminders = reminderService.getDueInRange(start, end);
        return ResponseEntity.ok(ApiResponse.success(reminders));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Reminder>> getById(@PathVariable UUID id) {
        Reminder reminder = reminderService.getById(id);
        return ResponseEntity.ok(ApiResponse.success(reminder));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<Reminder>> create(@RequestBody Reminder reminder) {
        Reminder created = reminderService.create(reminder);
        return ResponseEntity.ok(ApiResponse.success(created, "Reminder created successfully"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<Reminder>> update(@PathVariable UUID id, @RequestBody Reminder reminder) {
        Reminder updated = reminderService.update(id, reminder);
        return ResponseEntity.ok(ApiResponse.success(updated, "Reminder updated successfully"));
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<ApiResponse<Reminder>> complete(@PathVariable UUID id) {
        Reminder completed = reminderService.complete(id);
        return ResponseEntity.ok(ApiResponse.success(completed, "Reminder completed"));
    }

    @PostMapping("/{id}/snooze")
    public ResponseEntity<ApiResponse<Reminder>> snooze(@PathVariable UUID id, @RequestParam LocalDate newDueDate) {
        Reminder snoozed = reminderService.snooze(id, newDueDate);
        return ResponseEntity.ok(ApiResponse.success(snoozed, "Reminder snoozed"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        reminderService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Reminder deleted successfully"));
    }
}

