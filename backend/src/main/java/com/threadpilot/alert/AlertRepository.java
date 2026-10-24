package com.threadpilot.alert;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AlertRepository extends JpaRepository<Alert, UUID> {

    @Query("SELECT a FROM Alert a WHERE a.organization.id = :orgId ORDER BY a.createdAt DESC")
    Page<Alert> findByOrganizationId(@Param("orgId") UUID organizationId, Pageable pageable);

    @Query("SELECT a FROM Alert a WHERE a.organization.id = :orgId AND a.status = 'UNREAD' ORDER BY a.createdAt DESC")
    Page<Alert> findUnreadByOrganizationId(@Param("orgId") UUID organizationId, Pageable pageable);

    @Query("SELECT a FROM Alert a WHERE a.assignedUser.id = :userId AND a.status = 'UNREAD' ORDER BY a.createdAt DESC")
    List<Alert> findUnreadByAssignedUser(@Param("userId") UUID userId);

    @Query("SELECT a FROM Alert a WHERE a.organization.id = :orgId AND a.alertType = :type ORDER BY a.createdAt DESC")
    Page<Alert> findByType(@Param("orgId") UUID organizationId, @Param("type") AlertType type, Pageable pageable);

    @Query("SELECT a FROM Alert a WHERE a.organization.id = :orgId AND a.entityType = :entityType AND a.entityId = :entityId ORDER BY a.createdAt DESC")
    List<Alert> findByEntity(@Param("orgId") UUID organizationId, @Param("entityType") String entityType, @Param("entityId") UUID entityId);

    @Query("SELECT COUNT(a) FROM Alert a WHERE a.organization.id = :orgId AND a.status = 'UNREAD'")
    long countUnread(@Param("orgId") UUID organizationId);

    @Query("SELECT COUNT(a) FROM Alert a WHERE a.assignedUser.id = :userId AND a.status = 'UNREAD'")
    long countUnreadByAssignedUser(@Param("userId") UUID userId);

    @Query("SELECT a FROM Alert a WHERE a.organization.id = :orgId AND a.severity = :severity ORDER BY a.createdAt DESC")
    Page<Alert> findBySeverity(@Param("orgId") UUID organizationId, @Param("severity") AlertSeverity severity, Pageable pageable);

    @Query("SELECT a FROM Alert a WHERE a.organization.id = :orgId AND a.status = :status ORDER BY a.createdAt DESC")
    Page<Alert> findByStatus(@Param("orgId") UUID organizationId, @Param("status") AlertStatus status, Pageable pageable);

    @Query("SELECT a FROM Alert a WHERE a.organization.id = :orgId AND a.severity = :severity AND a.status = :status ORDER BY a.createdAt DESC")
    Page<Alert> findBySeverityAndStatus(@Param("orgId") UUID organizationId, @Param("severity") AlertSeverity severity, @Param("status") AlertStatus status, Pageable pageable);
}

