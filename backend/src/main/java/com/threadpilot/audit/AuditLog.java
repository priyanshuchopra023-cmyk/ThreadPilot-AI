package com.threadpilot.audit;

import com.threadpilot.common.util.BaseEntity;
import com.threadpilot.organization.Organization;
import com.threadpilot.user.User;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "audit_logs", indexes = {
    @Index(name = "idx_audit_logs_org", columnList = "organization_id"),
    @Index(name = "idx_audit_logs_user", columnList = "user_id"),
    @Index(name = "idx_audit_logs_action", columnList = "action"),
    @Index(name = "idx_audit_logs_entity", columnList = "entityType, entityId"),
    @Index(name = "idx_audit_logs_timestamp", columnList = "created_at"),
    @Index(name = "idx_audit_logs_ip", columnList = "ipAddress")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog extends BaseEntity {

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "action", nullable = false, length = 50)
    private AuditAction action;

    @NotBlank
    @Size(max = 100)
    @Column(name = "entity_type", nullable = false)
    private String entityType;

    @Column(name = "entity_id")
    private java.util.UUID entityId;

    @Size(max = 100)
    @Column(name = "entity_reference")
    private String entityReference;

    @Column(name = "previous_values", columnDefinition = "JSONB")
    private String previousValues;

    @Column(name = "new_values", columnDefinition = "JSONB")
    private String newValues;

    @Column(name = "changed_fields", columnDefinition = "JSONB")
    private String changedFields;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Size(max = 45)
    @Column(name = "ip_address")
    private String ipAddress;

    @Size(max = 500)
    @Column(name = "user_agent")
    private String userAgent;

    @Size(max = 100)
    @Column(name = "session_id")
    private String sessionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "correlation_id")
    private java.util.UUID correlationId;
}

