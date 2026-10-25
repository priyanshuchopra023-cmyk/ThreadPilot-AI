package com.threadpilot.copilot;

import com.threadpilot.common.util.BaseEntity;
import com.threadpilot.organization.Organization;
import com.threadpilot.user.User;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "ai_conversations", indexes = {
    @Index(name = "idx_ai_conversations_org", columnList = "organization_id"),
    @Index(name = "idx_ai_conversations_user", columnList = "user_id"),
    @Index(name = "idx_ai_conversations_status", columnList = "status"),
    @Index(name = "idx_ai_conversations_updated_at", columnList = "updated_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AIConversation extends BaseEntity {

    @Size(max = 200)
    @Column(name = "title")
    private String title;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private ConversationStatus status = ConversationStatus.ACTIVE;

    @Column(name = "context_summary", columnDefinition = "TEXT")
    private String contextSummary;

    @Column(name = "total_tokens_used")
    @Builder.Default
    private Integer totalTokensUsed = 0;

    @Column(name = "total_cost", precision = 10, scale = 6)
    @Builder.Default
    private java.math.BigDecimal totalCost = java.math.BigDecimal.ZERO;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "last_message_at")
    private Instant lastMessageAt;

    @OneToMany(mappedBy = "conversation", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private Set<AIMessage> messages = new HashSet<>();
}

