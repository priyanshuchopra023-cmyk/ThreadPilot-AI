package com.threadpilot.organization;

import com.threadpilot.common.dto.ApiResponse;
import com.threadpilot.common.dto.PageResponse;
import com.threadpilot.common.dto.PaginationRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/organizations")
@RequiredArgsConstructor
public class OrganizationController {

    private final OrganizationService organizationService;

    @GetMapping("/current")
    public ResponseEntity<ApiResponse<Organization>> getCurrent() {
        Organization org = organizationService.getCurrentOrganization();
        return ResponseEntity.ok(ApiResponse.success(org));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('OWNER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Organization>> getById(@PathVariable java.util.UUID id) {
        Organization org = organizationService.getById(id);
        return ResponseEntity.ok(ApiResponse.success(org));
    }

    @GetMapping
    @PreAuthorize("hasRole('OWNER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PageResponse<Organization>>> search(
            @RequestParam(required = false) String name,
            PaginationRequest request
    ) {
        PageResponse<Organization> page = organizationService.search(name, request);
        return ResponseEntity.ok(ApiResponse.success(page));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('OWNER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Organization>> update(
            @PathVariable java.util.UUID id,
            @RequestBody Organization organization
    ) {
        organization.setId(id);
        Organization updated = organizationService.update(organization);
        return ResponseEntity.ok(ApiResponse.success(updated, "Organization updated successfully"));
    }
}

