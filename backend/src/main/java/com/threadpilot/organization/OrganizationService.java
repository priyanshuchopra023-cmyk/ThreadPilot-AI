package com.threadpilot.organization;

import com.threadpilot.common.dto.PageResponse;
import com.threadpilot.common.dto.PaginationRequest;
import com.threadpilot.common.exception.BusinessException;
import com.threadpilot.common.exception.ResourceNotFoundException;
import com.threadpilot.security.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrganizationService {

    private final OrganizationRepository organizationRepository;

    @Transactional(readOnly = true)
    public Organization getCurrentOrganization() {
        UUID orgId = TenantContext.getOrganizationId();
        if (orgId == null) {
            throw new BusinessException("NO_TENANT", "No organization context available");
        }
        return organizationRepository.findById(orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization", orgId));
    }

    @Transactional(readOnly = true)
    public Organization getById(UUID id) {
        UUID currentOrgId = TenantContext.getOrganizationId();
        if (!currentOrgId.equals(id)) {
            throw new BusinessException("ACCESS_DENIED", "Cannot access other organization's data");
        }
        return organizationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Organization", id));
    }

@Transactional(readOnly = true)
    public PageResponse<Organization> search(String name, PaginationRequest request) {
        UUID orgId = TenantContext.getOrganizationId();
        Page<Organization> page = organizationRepository.searchByName(name, request.toPageable());
        return PageResponse.of(page);
    }

    @Transactional
    public Organization update(Organization organization) {
        UUID currentOrgId = TenantContext.getOrganizationId();
        if (!currentOrgId.equals(organization.getId())) {
            throw new BusinessException("ACCESS_DENIED", "Cannot update other organization's data");
        }
        return organizationRepository.save(organization);
    }
}

