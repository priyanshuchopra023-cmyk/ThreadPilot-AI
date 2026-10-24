package com.threadpilot.audit;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {

    @Query("SELECT a FROM AuditLog a WHERE a.organization.id = :orgId ORDER BY a.createdAt DESC")
    Page<AuditLog> findByOrganizationId(@Param("orgId") UUID organizationId, Pageable pageable);

    @Query("SELECT a FROM AuditLog a WHERE a.user.id = :userId ORDER BY a.createdAt DESC")
    Page<AuditLog> findByUserId(@Param("userId") UUID userId, Pageable pageable);

@Query("SELECT a FROM AuditLog a WHERE a.organization.id = :orgId AND a.entityType = :entityType AND a.entityId = :entityId ORDER BY a.createdAt DESC")
    Page<AuditLog> findByEntity(@Param("orgId") UUID organizationId, @Param("entityType") String entityType, @Param("entityId") UUID entityId, Pageable pageable);

    @Query("SELECT a FROM AuditLog a WHERE a.organization.id = :orgId AND a.action = :action ORDER BY a.createdAt DESC")
    Page<AuditLog> findByAction(@Param("orgId") UUID organizationId, @Param("action") AuditAction action, Pageable pageable);

    @Query("SELECT a FROM AuditLog a WHERE a.organization.id = :orgId AND a.createdAt BETWEEN :start AND :end ORDER BY a.createdAt DESC")
    Page<AuditLog> findByDateRange(@Param("orgId") UUID organizationId, @Param("start") Instant start, @Param("end") Instant end, Pageable pageable);

    @Query("SELECT a FROM AuditLog a WHERE a.correlationId = :correlationId ORDER BY a.createdAt ASC")
    Page<AuditLog> findByCorrelationId(@Param("correlationId") UUID correlationId, Pageable pageable);
}

