package com.threadpilot.audit;

import com.threadpilot.common.dto.PageResponse;
import com.threadpilot.common.dto.PaginationRequest;
import com.threadpilot.organization.Organization;
import com.threadpilot.security.TenantContext;
import com.threadpilot.user.User;
import com.threadpilot.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditService {

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;

    @Transactional
    public void log(AuditAction action, String entityType, UUID entityId, String entityReference,
                    Object previousValues, Object newValues, String description) {
        UUID orgId = TenantContext.requireTenantId();
        UUID userId = TenantContext.getUserId();

        String changedFields = null;
        if (previousValues != null && newValues != null) {
            // In production, compute actual diff
            changedFields = "updated";
        }

        AuditLog log = AuditLog.builder()
                .action(action)
                .entityType(entityType)
                .entityId(entityId)
                .entityReference(entityReference)
                .previousValues(previousValues != null ? toJson(previousValues) : null)
                .newValues(newValues != null ? toJson(newValues) : null)
                .changedFields(changedFields)
                .description(description)
                .organization(new Organization() {{ setId(orgId); }})
                .user(userId != null ? userRepository.findById(userId).orElse(null) : null)
                .ipAddress(getClientIp())
                .build();

        auditLogRepository.save(log);
    }

@Transactional(readOnly = true)
    public PageResponse<AuditLog> getAll(PaginationRequest request) {
        UUID orgId = TenantContext.requireTenantId();
        Page<AuditLog> page = auditLogRepository.findByOrganizationId(orgId, request.toPageable());
        return PageResponse.of(page);
    }

    @Transactional(readOnly = true)
    public PageResponse<AuditLog> getByEntity(String entityType, UUID entityId, PaginationRequest request) {
        UUID orgId = TenantContext.requireTenantId();
        Page<AuditLog> page = auditLogRepository.findByEntity(orgId, entityType, entityId, request.toPageable());
        return PageResponse.of(page);
    }

    @Transactional(readOnly = true)
    public PageResponse<AuditLog> getByAction(AuditAction action, PaginationRequest request) {
        UUID orgId = TenantContext.requireTenantId();
        Page<AuditLog> page = auditLogRepository.findByAction(orgId, action, request.toPageable());
        return PageResponse.of(page);
    }

    @Transactional(readOnly = true)
    public PageResponse<AuditLog> getByUser(UUID userId, PaginationRequest request) {
        UUID orgId = TenantContext.requireTenantId();
        Page<AuditLog> page = auditLogRepository.findByUserId(userId, request.toPageable());
        return PageResponse.of(page);
    }

@Transactional(readOnly = true)
    public PageResponse<AuditLog> getByDateRange(Instant start, Instant end, PaginationRequest request) {
        UUID orgId = TenantContext.requireTenantId();
        Page<AuditLog> page = auditLogRepository.findByDateRange(orgId, start, end, request.toPageable());
        return PageResponse.of(page);
    }

    @Transactional(readOnly = true)
    public PageResponse<AuditLog> getByCorrelationId(UUID correlationId, PaginationRequest request) {
        UUID orgId = TenantContext.requireTenantId();
        Page<AuditLog> page = auditLogRepository.findByCorrelationId(correlationId, request.toPageable());
        return PageResponse.of(page);
    }

    private String toJson(Object obj) {
        try {
            return new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(obj);
        } catch (Exception e) {
            return obj.toString();
        }
    }

    private String getClientIp() {
        // In production, extract from request context
        return "unknown";
    }
}

