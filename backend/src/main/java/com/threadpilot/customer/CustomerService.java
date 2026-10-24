package com.threadpilot.customer;

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
public class CustomerService {

    private final CustomerRepository customerRepository;

    @Transactional(readOnly = true)
    public PageResponse<Customer> getAll(PaginationRequest request) {
        UUID orgId = TenantContext.requireTenantId();
        Page<Customer> page = customerRepository.findActiveByOrganizationId(orgId, request.toPageable());
        return PageResponse.of(page);
    }

    @Transactional(readOnly = true)
    public PageResponse<Customer> search(String term, PaginationRequest request) {
        UUID orgId = TenantContext.requireTenantId();
        Page<Customer> page = customerRepository.search(orgId, term, request.toPageable());
        return PageResponse.of(page);
    }

    @Transactional(readOnly = true)
    public Customer getById(UUID id) {
        UUID orgId = TenantContext.requireTenantId();
        return customerRepository.findById(id)
                .filter(c -> c.getOrganization().getId().equals(orgId))
                .orElseThrow(() -> new ResourceNotFoundException("Customer", id));
    }

    @Transactional(readOnly = true)
    public List<Customer> getWithOutstanding() {
        UUID orgId = TenantContext.requireTenantId();
        return customerRepository.findWithOutstandingActive(orgId);
    }

    @Transactional(readOnly = true)
    public List<Customer> getWithOutstandingAboveThreshold(BigDecimal threshold) {
        UUID orgId = TenantContext.requireTenantId();
        return customerRepository.findWithOutstandingAboveThreshold(orgId, threshold);
    }

    @Transactional(readOnly = true)
    public List<Customer> getExceedingCreditLimit() {
        UUID orgId = TenantContext.requireTenantId();
        return customerRepository.findExceedingCreditLimit(orgId);
    }

    @Transactional(readOnly = true)
    public BigDecimal getTotalOutstanding() {
        UUID orgId = TenantContext.requireTenantId();
        return customerRepository.getTotalOutstanding(orgId);
    }

    @Transactional
    public Customer create(Customer customer) {
        UUID orgId = TenantContext.requireTenantId();

        if (customer.getGstNumber() != null && customerRepository.existsByGstNumberAndOrganizationId(customer.getGstNumber(), orgId)) {
            throw new BusinessException("CONFLICT", "Customer with GST number " + customer.getGstNumber() + " already exists");
        }

        Organization organization = new Organization();
        organization.setId(orgId);
        customer.setOrganization(organization);
        customer.setOutstandingAmount(BigDecimal.ZERO);
        customer = customerRepository.save(customer);

        log.info("Created customer: {}", customer.getName());
        return customer;
    }

    @Transactional
    public Customer update(UUID id, Customer customer) {
        UUID orgId = TenantContext.requireTenantId();
        Customer existing = getById(id);

        if (customer.getGstNumber() != null && !customer.getGstNumber().equals(existing.getGstNumber()) &&
                customerRepository.existsByGstNumberAndOrganizationIdAndIdNot(customer.getGstNumber(), orgId, id)) {
            throw new BusinessException("CONFLICT", "Customer with GST number " + customer.getGstNumber() + " already exists");
        }

        existing.setName(customer.getName());
        existing.setBusinessName(customer.getBusinessName());
        existing.setPhone(customer.getPhone());
        existing.setEmail(customer.getEmail());
        existing.setAddress(customer.getAddress());
        existing.setCity(customer.getCity());
        existing.setState(customer.getState());
        existing.setPostalCode(customer.getPostalCode());
        existing.setGstNumber(customer.getGstNumber());
        existing.setPanNumber(customer.getPanNumber());
        existing.setCustomerType(customer.getCustomerType());
        existing.setCreditLimit(customer.getCreditLimit());
        existing.setPaymentTerms(customer.getPaymentTerms());
        existing.setStatus(customer.getStatus());
        existing.setNotes(customer.getNotes());

        return customerRepository.save(existing);
    }

    @Transactional
    public void delete(UUID id) {
        UUID orgId = TenantContext.requireTenantId();
        Customer customer = getById(id);
        customerRepository.delete(customer);
        log.info("Deleted customer: {}", customer.getName());
    }
}

