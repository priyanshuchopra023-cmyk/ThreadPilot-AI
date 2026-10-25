package com.threadpilot.alert;

import com.threadpilot.common.util.BaseEntity;
import com.threadpilot.organization.Organization;
import com.threadpilot.user.User;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;

@Entity
@Table(name = "alerts", indexes = {
    @Index(name = "idx_alerts_org", columnList = "organization_id"),
    @Index(name = "idx_alerts_type", columnList = "alertType"),
    @Index(name = "idx_alerts_status", columnList = "status"),
    @Index(name = "idx_alerts_severity", columnList = "severity"),
    @Index(name = "idx_alerts_entity", columnList = "entityType, entityId"),
    @Index(name = "idx_alerts_assigned_user", columnList = "assignedUserId"),
    @Index(name = "idx_alerts_created_at", columnList = "created_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Alert extends BaseEntity {

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "alert_type", nullable = false, length = 50)
    private AlertType alertType;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "severity", nullable = false, length = 20)
    private AlertSeverity severity;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private AlertStatus status = AlertStatus.UNREAD;

    @NotBlank
    @Size(max = 200)
    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "message", columnDefinition = "TEXT", nullable = false)
    private String message;

    @Size(max = 100)
    @Column(name = "entity_type")
    private String entityType;

    @Column(name = "entity_id")
    private java.util.UUID entityId;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "supporting_data", columnDefinition = "JSONB")
    private String supportingData;

    @Column(name = "action_url")
    private String actionUrl;

    @Column(name = "action_label")
    private String actionLabel;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_user_id")
    private User assignedUser;

    @Column(name = "read_at")
    private Instant readAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "read_by")
    private User readBy;

    @Column(name = "dismissed_at")
    private Instant dismissedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dismissed_by")
    private User dismissedBy;

    @Column(name = "resolved_at")
    private Instant resolvedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resolved_by")
    private User resolvedBy;

    @Column(name = "expires_at")
    private Instant expiresAt;
}

