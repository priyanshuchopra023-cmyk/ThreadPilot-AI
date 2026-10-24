package com.threadpilot.ai;

import com.threadpilot.common.util.BaseEntity;
import com.threadpilot.organization.Organization;
import com.threadpilot.user.User;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "ai_recommendations", indexes = {
    @Index(name = "idx_ai_recommendations_org", columnList = "organization_id"),
    @Index(name = "idx_ai_recommendations_type", columnList = "recommendationType"),
    @Index(name = "idx_ai_recommendations_status", columnList = "status"),
    @Index(name = "idx_ai_recommendations_severity", columnList = "severity"),
    @Index(name = "idx_ai_recommendations_entity", columnList = "entityType, entityId"),
    @Index(name = "idx_ai_recommendations_created_at", columnList = "created_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AIRecommendation extends BaseEntity {

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "recommendation_type", nullable = false, length = 50)
    private RecommendationType recommendationType;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "severity", nullable = false, length = 20)
    private RecommendationSeverity severity;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private RecommendationStatus status = RecommendationStatus.PENDING;

    @NotBlank
    @Size(max = 200)
    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "explanation", columnDefinition = "TEXT", nullable = false)
    private String explanation;

    @Column(name = "supporting_data", columnDefinition = "JSONB")
    private String supportingData;

    @DecimalMin(value = "0.0")
    @DecimalMax(value = "1.0")
    @Digits(integer = 1, fraction = 2)
    @Column(name = "confidence", precision = 3, scale = 2)
    private BigDecimal confidence;

    @Size(max = 100)
    @Column(name = "entity_type")
    private String entityType;

    @Column(name = "entity_id")
    private java.util.UUID entityId;

    @Column(name = "action_url")
    private String actionUrl;

    @Column(name = "action_label")
    private String actionLabel;

    @Column(name = "estimated_impact", columnDefinition = "TEXT")
    private String estimatedImpact;

    @Column(name = "ai_model_used")
    private String aiModelUsed;

    @Column(name = "ai_provider")
    private String aiProvider;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @Column(name = "reviewed_at")
    private Instant reviewedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by")
    private User reviewedBy;

    @Column(name = "implemented_at")
    private Instant implementedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "implemented_by")
    private User implementedBy;

    @Column(name = "dismissed_at")
    private Instant dismissedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dismissed_by")
    private User dismissedBy;

    @Column(name = "dismiss_reason", columnDefinition = "TEXT")
    private String dismissReason;
}

