package com.threadpilot.copilot;

import com.threadpilot.common.util.BaseEntity;
import com.threadpilot.organization.Organization;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.List;

@Entity
@Table(name = "ai_messages", indexes = {
    @Index(name = "idx_ai_messages_conversation", columnList = "conversation_id"),
    @Index(name = "idx_ai_messages_role", columnList = "role"),
    @Index(name = "idx_ai_messages_created_at", columnList = "created_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AIMessage extends BaseEntity {

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 20)
    private MessageRole role;

    @Column(name = "content", columnDefinition = "TEXT", nullable = false)
    private String content;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "tool_calls", columnDefinition = "JSONB")
    private String toolCalls;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "tool_results", columnDefinition = "JSONB")
    private String toolResults;

    @Column(name = "tokens_used")
    @Builder.Default
    private Integer tokensUsed = 0;

    @Column(name = "cost", precision = 10, scale = 6)
    @Builder.Default
    private java.math.BigDecimal cost = java.math.BigDecimal.ZERO;

    @Column(name = "model_used")
    private String modelUsed;

    @Column(name = "provider")
    private String provider;

    @Column(name = "processing_time_ms")
    private Long processingTimeMs;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "metadata", columnDefinition = "JSONB")
    private String metadata;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conversation_id", nullable = false)
    private AIConversation conversation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;
}

