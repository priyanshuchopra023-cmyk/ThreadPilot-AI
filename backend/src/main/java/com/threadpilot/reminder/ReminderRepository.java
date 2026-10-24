package com.threadpilot.reminder;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface ReminderRepository extends JpaRepository<Reminder, UUID> {

    @Query("SELECT r FROM Reminder r WHERE r.organization.id = :orgId ORDER BY r.dueDate ASC")
    Page<Reminder> findByOrganizationId(@Param("orgId") UUID organizationId, Pageable pageable);

    @Query("SELECT r FROM Reminder r WHERE r.assignedUser.id = :userId AND r.status IN ('PENDING', 'IN_PROGRESS', 'OVERDUE') ORDER BY r.dueDate ASC")
    Page<Reminder> findByAssignedUser(@Param("userId") UUID userId, Pageable pageable);

    @Query("SELECT r FROM Reminder r WHERE r.organization.id = :orgId AND r.dueDate = :date AND r.status IN ('PENDING', 'IN_PROGRESS', 'OVERDUE') ORDER BY r.dueTime ASC")
    List<Reminder> findDueToday(@Param("orgId") UUID organizationId, @Param("date") LocalDate date);

    @Query("SELECT r FROM Reminder r WHERE r.assignedUser.id = :userId AND r.dueDate = :date AND r.status IN ('PENDING', 'IN_PROGRESS', 'OVERDUE') ORDER BY r.dueTime ASC")
    List<Reminder> findDueTodayForUser(@Param("userId") UUID userId, @Param("date") LocalDate date);

    @Query("SELECT r FROM Reminder r WHERE r.organization.id = :orgId AND r.dueDate BETWEEN :start AND :end AND r.status IN ('PENDING', 'IN_PROGRESS', 'OVERDUE') ORDER BY r.dueDate ASC, r.dueTime ASC")
    List<Reminder> findDueInRange(@Param("orgId") UUID organizationId, @Param("start") LocalDate start, @Param("end") LocalDate end);

    @Query("SELECT r FROM Reminder r WHERE r.organization.id = :orgId AND r.reminderType = :type ORDER BY r.dueDate ASC")
    Page<Reminder> findByType(@Param("orgId") UUID organizationId, @Param("type") ReminderType type, Pageable pageable);

    @Query("SELECT COUNT(r) FROM Reminder r WHERE r.organization.id = :orgId AND r.status IN ('PENDING', 'IN_PROGRESS', 'OVERDUE')")
    long countPending(@Param("orgId") UUID organizationId);

    @Query("SELECT COUNT(r) FROM Reminder r WHERE r.assignedUser.id = :userId AND r.status IN ('PENDING', 'IN_PROGRESS', 'OVERDUE')")
    long countPendingByAssignedUser(@Param("userId") UUID userId);
}

