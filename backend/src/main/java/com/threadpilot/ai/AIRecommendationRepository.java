package com.threadpilot.ai;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AIRecommendationRepository extends JpaRepository<AIRecommendation, UUID> {

    @Query("SELECT r FROM AIRecommendation r WHERE r.organization.id = :orgId ORDER BY r.createdAt DESC")
    Page<AIRecommendation> findByOrganizationId(@Param("orgId") UUID organizationId, Pageable pageable);

    @Query("SELECT r FROM AIRecommendation r WHERE r.organization.id = :orgId AND r.status = 'PENDING' ORDER BY r.severity DESC, r.createdAt DESC")
    List<AIRecommendation> findPendingByOrganizationId(@Param("orgId") UUID organizationId);

    @Query("SELECT r FROM AIRecommendation r WHERE r.organization.id = :orgId AND r.recommendationType = :type ORDER BY r.createdAt DESC")
    Page<AIRecommendation> findByType(@Param("orgId") UUID organizationId, @Param("type") RecommendationType type, Pageable pageable);

    @Query("SELECT r FROM AIRecommendation r WHERE r.organization.id = :orgId AND r.entityType = :entityType AND r.entityId = :entityId ORDER BY r.createdAt DESC")
    List<AIRecommendation> findByEntity(@Param("orgId") UUID organizationId, @Param("entityType") String entityType, @Param("entityId") UUID entityId);

    @Query("SELECT COUNT(r) FROM AIRecommendation r WHERE r.organization.id = :orgId AND r.status = 'PENDING'")
    long countPending(@Param("orgId") UUID organizationId);
}

