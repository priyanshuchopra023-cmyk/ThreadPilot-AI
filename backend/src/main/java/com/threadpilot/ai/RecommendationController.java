package com.threadpilot.ai;

import com.threadpilot.ai.RecommendationStatus;
import com.threadpilot.common.dto.ApiResponse;
import com.threadpilot.common.dto.PageResponse;
import com.threadpilot.common.dto.PaginationRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/recommendations")
@RequiredArgsConstructor
public class RecommendationController {

    private final AIRecommendationRepository recommendationRepository;
    private final RecommendationService recommendationService;

@GetMapping
    public ResponseEntity<ApiResponse<PageResponse<AIRecommendation>>> getAll(PaginationRequest request) {
        UUID orgId = com.threadpilot.security.TenantContext.requireTenantId();
        var page = recommendationRepository.findByOrganizationId(orgId, request.toPageable());
        return ResponseEntity.ok(ApiResponse.success(PageResponse.of(page)));
    }

    @GetMapping("/pending")
    public ResponseEntity<ApiResponse<List<AIRecommendation>>> getPending() {
        List<AIRecommendation> recommendations = recommendationService.getPendingRecommendations();
        return ResponseEntity.ok(ApiResponse.success(recommendations));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AIRecommendation>> getById(@PathVariable UUID id) {
        UUID orgId = com.threadpilot.security.TenantContext.requireTenantId();
        AIRecommendation rec = recommendationRepository.findById(id)
                .filter(r -> r.getOrganization().getId().equals(orgId))
                .orElseThrow(() -> new com.threadpilot.common.exception.ResourceNotFoundException("Recommendation", id));
        return ResponseEntity.ok(ApiResponse.success(rec));
    }

    @PostMapping("/{id}/accept")
    public ResponseEntity<ApiResponse<AIRecommendation>> accept(@PathVariable UUID id) {
        UUID orgId = com.threadpilot.security.TenantContext.requireTenantId();
        UUID userId = com.threadpilot.security.TenantContext.getUserId();

        AIRecommendation rec = recommendationRepository.findById(id)
                .filter(r -> r.getOrganization().getId().equals(orgId))
                .orElseThrow(() -> new com.threadpilot.common.exception.ResourceNotFoundException("Recommendation", id));

        rec.setStatus(RecommendationStatus.ACCEPTED);
        rec.setReviewedAt(java.time.Instant.now());
        rec.setReviewedBy(new com.threadpilot.user.User() {{ setId(userId); }});
        recommendationRepository.save(rec);

        return ResponseEntity.ok(ApiResponse.success(rec, "Recommendation accepted"));
    }

    @PostMapping("/{id}/implement")
    public ResponseEntity<ApiResponse<AIRecommendation>> implement(@PathVariable UUID id) {
        UUID orgId = com.threadpilot.security.TenantContext.requireTenantId();
        UUID userId = com.threadpilot.security.TenantContext.getUserId();

        AIRecommendation rec = recommendationRepository.findById(id)
                .filter(r -> r.getOrganization().getId().equals(orgId))
                .orElseThrow(() -> new com.threadpilot.common.exception.ResourceNotFoundException("Recommendation", id));

        rec.setStatus(RecommendationStatus.IMPLEMENTED);
        rec.setImplementedAt(java.time.Instant.now());
        rec.setImplementedBy(new com.threadpilot.user.User() {{ setId(userId); }});
        recommendationRepository.save(rec);

        return ResponseEntity.ok(ApiResponse.success(rec, "Recommendation implemented"));
    }

    @PostMapping("/{id}/dismiss")
    public ResponseEntity<ApiResponse<AIRecommendation>> dismiss(@PathVariable UUID id, @RequestParam(required = false) String reason) {
        UUID orgId = com.threadpilot.security.TenantContext.requireTenantId();
        UUID userId = com.threadpilot.security.TenantContext.getUserId();

        AIRecommendation rec = recommendationRepository.findById(id)
                .filter(r -> r.getOrganization().getId().equals(orgId))
                .orElseThrow(() -> new com.threadpilot.common.exception.ResourceNotFoundException("Recommendation", id));

        rec.setStatus(RecommendationStatus.DISMISSED);
        rec.setDismissedAt(java.time.Instant.now());
        rec.setDismissedBy(new com.threadpilot.user.User() {{ setId(userId); }});
        rec.setDismissReason(reason);
        recommendationRepository.save(rec);

        return ResponseEntity.ok(ApiResponse.success(rec, "Recommendation dismissed"));
    }

    @PostMapping("/generate")
    public ResponseEntity<ApiResponse<Void>> generate() {
        recommendationService.generateRecommendations();
        return ResponseEntity.ok(ApiResponse.success(null, "Recommendations generated"));
    }
}

