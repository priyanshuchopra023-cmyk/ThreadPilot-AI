package com.threadpilot.reminder;

import com.threadpilot.common.dto.PageResponse;
import com.threadpilot.common.dto.PaginationRequest;
import com.threadpilot.common.exception.BusinessException;
import com.threadpilot.common.exception.ResourceNotFoundException;
import com.threadpilot.organization.Organization;
import com.threadpilot.security.TenantContext;
import com.threadpilot.user.User;
import com.threadpilot.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReminderService {

    private final ReminderRepository reminderRepository;
    private final UserRepository userRepository;

@Transactional(readOnly = true)
    public PageResponse<Reminder> getAll(PaginationRequest request) {
        UUID orgId = TenantContext.requireTenantId();
        var page = reminderRepository.findByOrganizationId(orgId, request.toPageable());
        return PageResponse.of(page);
    }

    @Transactional(readOnly = true)
    public PageResponse<Reminder> getByAssignedUser(UUID userId, PaginationRequest request) {
        UUID orgId = TenantContext.requireTenantId();
        var page = reminderRepository.findByAssignedUser(userId, request.toPageable());
        return PageResponse.of(page);
    }

    @Transactional(readOnly = true)
    public List<Reminder> getDueToday() {
        UUID orgId = TenantContext.requireTenantId();
        return reminderRepository.findDueToday(orgId, LocalDate.now());
    }

    @Transactional(readOnly = true)
    public List<Reminder> getDueTodayForUser(UUID userId) {
        return reminderRepository.findDueTodayForUser(userId, LocalDate.now());
    }

    @Transactional(readOnly = true)
    public List<Reminder> getDueInRange(LocalDate start, LocalDate end) {
        UUID orgId = TenantContext.requireTenantId();
        return reminderRepository.findDueInRange(orgId, start, end);
    }

    @Transactional(readOnly = true)
    public Reminder getById(UUID id) {
        UUID orgId = TenantContext.requireTenantId();
        return reminderRepository.findById(id)
                .filter(r -> r.getOrganization().getId().equals(orgId))
                .orElseThrow(() -> new ResourceNotFoundException("Reminder", id));
    }

    @Transactional
    public Reminder create(Reminder reminder) {
        UUID orgId = TenantContext.requireTenantId();
        UUID userId = TenantContext.getUserId();

        Organization organization = new Organization();
        organization.setId(orgId);

        reminder.setOrganization(organization);
        reminder.setCreatedBy(userId != null ? userRepository.findById(userId).orElse(null) : null);
        reminder.setStatus(ReminderStatus.PENDING);

        reminder = reminderRepository.save(reminder);
        log.info("Created reminder: {}", reminder.getTitle());
        return reminder;
    }

    @Transactional
    public Reminder update(UUID id, Reminder reminder) {
        UUID orgId = TenantContext.requireTenantId();
        Reminder existing = getById(id);

        existing.setTitle(reminder.getTitle());
        existing.setDescription(reminder.getDescription());
        existing.setReminderType(reminder.getReminderType());
        existing.setPriority(reminder.getPriority());
        existing.setDueDate(reminder.getDueDate());
        existing.setDueTime(reminder.getDueTime());
        existing.setAssignedUser(reminder.getAssignedUser());
        existing.setRecurring(reminder.getRecurring());
        existing.setRecurrencePattern(reminder.getRecurrencePattern());
        existing.setActionUrl(reminder.getActionUrl());

        return reminderRepository.save(existing);
    }

    @Transactional
    public Reminder complete(UUID id) {
        UUID orgId = TenantContext.requireTenantId();
        UUID userId = TenantContext.getUserId();

        Reminder reminder = getById(id);

        if (reminder.getStatus() == ReminderStatus.COMPLETED) {
            throw new BusinessException("INVALID_STATE", "Reminder is already completed");
        }

        reminder.setStatus(ReminderStatus.COMPLETED);
        reminder.setCompletedAt(Instant.now());
        reminder.setCompletedBy(userId != null ? userRepository.findById(userId).orElse(null) : null);

        if (reminder.getRecurring() && reminder.getRecurrencePattern() != null) {
            createNextRecurrence(reminder);
        }

        reminder = reminderRepository.save(reminder);
        log.info("Completed reminder: {}", reminder.getTitle());
        return reminder;
    }

    @Transactional
    public Reminder snooze(UUID id, LocalDate newDueDate) {
        UUID orgId = TenantContext.requireTenantId();
        Reminder reminder = getById(id);

        reminder.setStatus(ReminderStatus.SNOOZED);
        reminder.setDueDate(newDueDate);
        reminder = reminderRepository.save(reminder);

        log.info("Snoozed reminder: {} to {}", reminder.getTitle(), newDueDate);
        return reminder;
    }

    @Transactional
    public void delete(UUID id) {
        UUID orgId = TenantContext.requireTenantId();
        Reminder reminder = getById(id);
        reminderRepository.delete(reminder);
        log.info("Deleted reminder: {}", reminder.getTitle());
    }

    @Scheduled(cron = "0 0 7 * * ?") // Daily at 7 AM
    @Transactional
    public void processDailyReminders() {
        UUID orgId = TenantContext.requireTenantId();
        log.info("Processing daily reminders for organization: {}", orgId);

        LocalDate today = LocalDate.now();

        // Mark overdue reminders
        List<Reminder> overdue = reminderRepository.findDueInRange(orgId, LocalDate.MIN, today.minusDays(1));
        for (Reminder reminder : overdue) {
            if (reminder.getStatus() == ReminderStatus.PENDING || reminder.getStatus() == ReminderStatus.IN_PROGRESS) {
                reminder.setStatus(ReminderStatus.OVERDUE);
            }
        }
        reminderRepository.saveAll(overdue);

        // Create reminders for upcoming payments, low stock, etc.
        // This would integrate with other services in production
    }

    private void createNextRecurrence(Reminder reminder) {
        LocalDate nextDate = calculateNextDueDate(reminder.getDueDate(), reminder.getRecurrencePattern());
        if (nextDate != null) {
            Reminder next = Reminder.builder()
                    .reminderType(reminder.getReminderType())
                    .priority(reminder.getPriority())
                    .title(reminder.getTitle())
                    .description(reminder.getDescription())
                    .dueDate(nextDate)
                    .dueTime(reminder.getDueTime())
                    .entityType(reminder.getEntityType())
                    .entityId(reminder.getEntityId())
                    .actionUrl(reminder.getActionUrl())
                    .recurring(true)
                    .recurrencePattern(reminder.getRecurrencePattern())
                    .organization(reminder.getOrganization())
                    .assignedUser(reminder.getAssignedUser())
                    .createdBy(reminder.getCreatedBy())
                    .build();
            reminderRepository.save(next);
        }
    }

    private LocalDate calculateNextDueDate(LocalDate current, String pattern) {
        return switch (pattern.toUpperCase()) {
            case "DAILY" -> current.plusDays(1);
            case "WEEKLY" -> current.plusWeeks(1);
            case "MONTHLY" -> current.plusMonths(1);
            case "QUARTERLY" -> current.plusMonths(3);
            case "YEARLY" -> current.plusYears(1);
            default -> null;
        };
    }
}

