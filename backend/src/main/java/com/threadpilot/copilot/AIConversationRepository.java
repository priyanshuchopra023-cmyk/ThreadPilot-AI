package com.threadpilot.copilot;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AIConversationRepository extends JpaRepository<AIConversation, UUID> {

    @Query("SELECT c FROM AIConversation c WHERE c.user.id = :userId AND c.status = 'ACTIVE' ORDER BY c.lastMessageAt DESC")
    Page<AIConversation> findActiveByUserId(@Param("userId") UUID userId, Pageable pageable);

    @Query("SELECT c FROM AIConversation c WHERE c.organization.id = :orgId AND c.status = 'ACTIVE' ORDER BY c.lastMessageAt DESC")
    Page<AIConversation> findActiveByOrganizationId(@Param("orgId") UUID organizationId, Pageable pageable);

    @Query("SELECT c FROM AIConversation c WHERE c.user.id = :userId ORDER BY c.updatedAt DESC")
    Page<AIConversation> findByUserId(@Param("userId") UUID userId, Pageable pageable);
}

