package com.threadpilot.supplier;

import com.threadpilot.common.dto.PageResponse;
import com.threadpilot.common.dto.PaginationRequest;
import com.threadpilot.common.exception.BusinessException;
import com.threadpilot.common.exception.ResourceNotFoundException;
import com.threadpilot.organization.Organization;
import com.threadpilot.security.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class SupplierService {

    private final SupplierRepository supplierRepository;

    @Transactional(readOnly = true)
    public PageResponse<Supplier> getAll(PaginationRequest request) {
        UUID orgId = TenantContext.requireTenantId();
        Page<Supplier> page = supplierRepository.findActiveByOrganizationId(orgId, request.toPageable());
        return PageResponse.of(page);
    }

    @Transactional(readOnly = true)
    public PageResponse<Supplier> search(String term, PaginationRequest request) {
        UUID orgId = TenantContext.requireTenantId();
        Page<Supplier> page = supplierRepository.search(orgId, term, request.toPageable());
        return PageResponse.of(page);
    }

    @Transactional(readOnly = true)
    public Supplier getById(UUID id) {
        UUID orgId = TenantContext.requireTenantId();
        return supplierRepository.findById(id)
                .filter(s -> s.getOrganization().getId().equals(orgId))
                .orElseThrow(() -> new ResourceNotFoundException("Supplier", id));
    }

    @Transactional(readOnly = true)
    public List<Supplier> getWithOutstanding() {
        UUID orgId = TenantContext.requireTenantId();
        return supplierRepository.findWithOutstandingActive(orgId);
    }

    @Transactional(readOnly = true)
    public BigDecimal getTotalOutstanding() {
        UUID orgId = TenantContext.requireTenantId();
        return supplierRepository.getTotalOutstanding(orgId);
    }

    @Transactional
    public Supplier create(Supplier supplier) {
        UUID orgId = TenantContext.requireTenantId();

        if (supplier.getGstNumber() != null && supplierRepository.existsByGstNumberAndOrganizationId(supplier.getGstNumber(), orgId)) {
            throw new BusinessException("CONFLICT", "Supplier with GST number " + supplier.getGstNumber() + " already exists");
        }

        Organization organization = new Organization();
        organization.setId(orgId);
        supplier.setOrganization(organization);
        supplier.setOutstandingAmount(BigDecimal.ZERO);
        supplier = supplierRepository.save(supplier);

        log.info("Created supplier: {}", supplier.getName());
        return supplier;
    }

    @Transactional
    public Supplier update(UUID id, Supplier supplier) {
        UUID orgId = TenantContext.requireTenantId();
        Supplier existing = getById(id);

        if (supplier.getGstNumber() != null && !supplier.getGstNumber().equals(existing.getGstNumber()) &&
                supplierRepository.existsByGstNumberAndOrganizationIdAndIdNot(supplier.getGstNumber(), orgId, id)) {
            throw new BusinessException("CONFLICT", "Supplier with GST number " + supplier.getGstNumber() + " already exists");
        }

        existing.setName(supplier.getName());
        existing.setCompanyName(supplier.getCompanyName());
        existing.setPhone(supplier.getPhone());
        existing.setEmail(supplier.getEmail());
        existing.setAddress(supplier.getAddress());
        existing.setCity(supplier.getCity());
        existing.setState(supplier.getState());
        existing.setPostalCode(supplier.getPostalCode());
        existing.setGstNumber(supplier.getGstNumber());
        existing.setPanNumber(supplier.getPanNumber());
        existing.setPaymentTerms(supplier.getPaymentTerms());
        existing.setStatus(supplier.getStatus());
        existing.setNotes(supplier.getNotes());

        return supplierRepository.save(existing);
    }

    @Transactional
    public void delete(UUID id) {
        UUID orgId = TenantContext.requireTenantId();
        Supplier supplier = getById(id);
        supplierRepository.delete(supplier);
        log.info("Deleted supplier: {}", supplier.getName());
    }
}

