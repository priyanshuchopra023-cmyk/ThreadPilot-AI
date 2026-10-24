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
public interface AIMessageRepository extends JpaRepository<AIMessage, UUID> {

    @Query("SELECT m FROM AIMessage m WHERE m.conversation.id = :conversationId ORDER BY m.createdAt ASC")
    Page<AIMessage> findByConversationId(@Param("conversationId") UUID conversationId, Pageable pageable);

    @Query("SELECT m FROM AIMessage m WHERE m.conversation.id = :conversationId ORDER BY m.createdAt ASC")
    List<AIMessage> findByConversationIdOrderByCreatedAt(@Param("conversationId") UUID conversationId);
}

