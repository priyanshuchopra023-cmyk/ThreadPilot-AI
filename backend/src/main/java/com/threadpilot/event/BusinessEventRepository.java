package com.threadpilot.event;

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
public interface BusinessEventRepository extends JpaRepository<BusinessEvent, UUID> {

    @Query("SELECT e FROM BusinessEvent e WHERE e.organization.id = :orgId ORDER BY e.timestamp DESC")
    Page<BusinessEvent> findByOrganizationId(@Param("orgId") UUID organizationId, Pageable pageable);

    @Query("SELECT e FROM BusinessEvent e WHERE e.organization.id = :orgId AND e.eventType = :type ORDER BY e.timestamp DESC")
    Page<BusinessEvent> findByType(@Param("orgId") UUID organizationId, @Param("type") EventType type, Pageable pageable);

    @Query("SELECT e FROM BusinessEvent e WHERE e.organization.id = :orgId AND e.entityType = :entityType AND e.entityId = :entityId ORDER BY e.timestamp DESC")
    List<BusinessEvent> findByEntity(@Param("orgId") UUID organizationId, @Param("entityType") String entityType, @Param("entityId") UUID entityId);

    @Query("SELECT e FROM BusinessEvent e WHERE e.organization.id = :orgId AND e.timestamp BETWEEN :start AND :end ORDER BY e.timestamp DESC")
    List<BusinessEvent> findByDateRange(@Param("orgId") UUID organizationId, @Param("start") Instant start, @Param("end") Instant end);

    @Query("SELECT e FROM BusinessEvent e WHERE e.organization.id = :orgId AND e.correlationId = :correlationId ORDER BY e.timestamp ASC")
    List<BusinessEvent> findByCorrelationId(@Param("orgId") UUID organizationId, @Param("correlationId") UUID correlationId);
}

