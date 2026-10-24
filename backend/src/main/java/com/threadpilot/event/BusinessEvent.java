package com.threadpilot.event;

import com.threadpilot.common.util.BaseEntity;
import com.threadpilot.organization.Organization;
import com.threadpilot.user.User;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

import java.time.Instant;
import java.util.Map;

@Entity
@Table(name = "business_events", indexes = {
    @Index(name = "idx_business_events_org", columnList = "organization_id"),
    @Index(name = "idx_business_events_type", columnList = "eventType"),
    @Index(name = "idx_business_events_entity", columnList = "entityType, entityId"),
    @Index(name = "idx_business_events_timestamp", columnList = "timestamp"),
    @Index(name = "idx_business_events_severity", columnList = "severity"),
    @Index(name = "idx_business_events_user", columnList = "user_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BusinessEvent extends BaseEntity {

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false, length = 50)
    private EventType eventType;

    @NotBlank
    @Size(max = 100)
    @Column(name = "entity_type", nullable = false)
    private String entityType;

    @Column(name = "entity_id")
    private java.util.UUID entityId;

    @Size(max = 100)
    @Column(name = "entity_reference")
    private String entityReference;

    @NotNull
    @Column(name = "timestamp", nullable = false)
    private Instant timestamp;

    @Enumerated(EnumType.STRING)
    @Column(name = "severity", length = 20)
    private EventSeverity severity = EventSeverity.INFO;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "metadata", columnDefinition = "JSONB")
    private String metadata;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "correlation_id")
    private java.util.UUID correlationId;

    @Column(name = "causation_id")
    private java.util.UUID causationId;
}

