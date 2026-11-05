package com.threadpilot.payment;

import com.threadpilot.common.dto.PageResponse;
import com.threadpilot.common.dto.PaginationRequest;
import com.threadpilot.common.exception.BusinessException;
import com.threadpilot.common.exception.ResourceNotFoundException;
import com.threadpilot.customer.Customer;
import com.threadpilot.customer.CustomerRepository;
import com.threadpilot.event.BusinessEvent;
import com.threadpilot.event.BusinessEventRepository;
import com.threadpilot.event.EventType;
import com.threadpilot.event.EventSeverity;
import com.threadpilot.invoice.SupplierInvoice;
import com.threadpilot.invoice.SupplierInvoiceRepository;
import com.threadpilot.order.CustomerOrder;
import com.threadpilot.order.CustomerOrderRepository;
import com.threadpilot.organization.Organization;
import com.threadpilot.security.TenantContext;
import com.threadpilot.supplier.Supplier;
import com.threadpilot.supplier.SupplierRepository;
import com.threadpilot.user.User;
import com.threadpilot.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final CustomerRepository customerRepository;
    private final SupplierRepository supplierRepository;
    private final SupplierInvoiceRepository invoiceRepository;
    private final CustomerOrderRepository orderRepository;
    private final UserRepository userRepository;
    private final BusinessEventRepository businessEventRepository;

    @Transactional(readOnly = true)
    public PageResponse<Payment> getAll(PaginationRequest request) {
        UUID orgId = TenantContext.requireTenantId();
        Page<Payment> page = paymentRepository.findByOrganizationId(orgId, request.toPageable());
        return PageResponse.of(page);
    }

    @Transactional(readOnly = true)
    public PageResponse<Payment> getByCustomer(UUID customerId, PaginationRequest request) {
        UUID orgId = TenantContext.requireTenantId();
        Page<Payment> page = paymentRepository.findByCustomerId(customerId, orgId, request.toPageable());
        return PageResponse.of(page);
    }

    @Transactional(readOnly = true)
    public List<Payment> getByCustomerList(UUID customerId) {
        UUID orgId = TenantContext.requireTenantId();
        return paymentRepository.findByCustomerId(customerId, orgId);
    }

    @Transactional(readOnly = true)
    public PageResponse<Payment> getBySupplier(UUID supplierId, PaginationRequest request) {
        UUID orgId = TenantContext.requireTenantId();
        Page<Payment> page = paymentRepository.findBySupplierId(supplierId, orgId, request.toPageable());
        return PageResponse.of(page);
    }

    @Transactional(readOnly = true)
    public List<Payment> getBySupplierList(UUID supplierId) {
        UUID orgId = TenantContext.requireTenantId();
        return paymentRepository.findBySupplierId(supplierId, orgId);
    }

    @Transactional(readOnly = true)
    public Payment getById(UUID id) {
        UUID orgId = TenantContext.requireTenantId();
        return paymentRepository.findById(id)
                .filter(p -> p.getOrganization().getId().equals(orgId))
                .orElseThrow(() -> new ResourceNotFoundException("Payment", id));
    }

    @Transactional(readOnly = true)
    public List<Payment> getBySupplierInvoice(UUID invoiceId) {
        UUID orgId = TenantContext.requireTenantId();
        return paymentRepository.findBySupplierInvoiceId(invoiceId, orgId);
    }

    @Transactional(readOnly = true)
    public List<Payment> getByCustomerOrder(UUID orderId) {
        UUID orgId = TenantContext.requireTenantId();
        return paymentRepository.findByCustomerOrderId(orderId, orgId);
    }

    @Transactional(readOnly = true)
    public List<Payment> getByDateRange(LocalDate start, LocalDate end) {
        UUID orgId = TenantContext.requireTenantId();
        return paymentRepository.findByDateRange(orgId, start, end);
    }

    @Transactional(readOnly = true)
    public BigDecimal getTotalCustomerPayments(LocalDate start, LocalDate end) {
        UUID orgId = TenantContext.requireTenantId();
        return paymentRepository.getTotalCustomerPayments(orgId, start, end);
    }

    @Transactional(readOnly = true)
    public BigDecimal getTotalSupplierPayments(LocalDate start, LocalDate end) {
        UUID orgId = TenantContext.requireTenantId();
        return paymentRepository.getTotalSupplierPayments(orgId, start, end);
    }

    @Transactional
    public Payment recordCustomerPayment(Payment payment) {
        final UUID orgId = TenantContext.requireTenantId();
        final UUID userId = TenantContext.getUserId();

        if (payment.getAmount() == null || payment.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException("INVALID_AMOUNT", "Payment amount must be greater than zero");
        }

        Customer customer = findCustomerByIdAndOrg(payment.getCustomer().getId(), orgId);

        if (payment.getPaymentNumber() == null || payment.getPaymentNumber().trim().isEmpty()) {
            payment.setPaymentNumber("PAY-CUST-" + System.currentTimeMillis() + "-" + UUID.randomUUID().toString().substring(0, 4).toUpperCase());
        }

        Organization organization = new Organization();
        organization.setId(orgId);

        payment.setCustomer(customer);
        payment.setOrganization(organization);
        payment.setPaymentType(PaymentType.CUSTOMER_PAYMENT);
        payment.setRecordedBy(userId != null ? userRepository.findById(userId).orElse(null) : null);

        // Validate order and check overpayment if linked
        if (payment.getCustomerOrder() != null && payment.getCustomerOrder().getId() != null) {
            CustomerOrder order = findCustomerOrderByIdAndOrg(payment.getCustomerOrder().getId(), orgId);
            if (payment.getAmount().compareTo(order.getOutstandingAmount()) > 0) {
                throw new BusinessException("OVERPAYMENT_NOT_ALLOWED",
                        "Payment amount (" + payment.getAmount() + ") cannot exceed order outstanding balance (" + order.getOutstandingAmount() + ")");
            }
            order.setPaidAmount(order.getPaidAmount().add(payment.getAmount()));
            order.updateOutstanding();
            orderRepository.save(order);
        }

        payment = paymentRepository.save(payment);

        // Update customer outstanding safely clamped to >= 0
        BigDecimal newCustomerBalance = customer.getOutstandingAmount().subtract(payment.getAmount());
        if (newCustomerBalance.compareTo(BigDecimal.ZERO) < 0) {
            newCustomerBalance = BigDecimal.ZERO;
        }
        customer.setOutstandingAmount(newCustomerBalance);
        customerRepository.save(customer);

        createBusinessEvent(payment, EventType.PAYMENT_RECEIVED, "Customer payment received: " + payment.getAmount());

        log.info("Recorded customer payment: {} for customer {}", payment.getAmount(), customer.getName());
        return payment;
    }

    private Customer findCustomerByIdAndOrg(UUID customerId, UUID orgId) {
        return customerRepository.findById(customerId)
                .filter(c -> c.getOrganization().getId().equals(orgId))
                .orElseThrow(() -> new ResourceNotFoundException("Customer", customerId));
    }

    private CustomerOrder findCustomerOrderByIdAndOrg(UUID orderId, UUID orgId) {
        return orderRepository.findById(orderId)
                .filter(o -> o.getOrganization().getId().equals(orgId))
                .orElseThrow(() -> new ResourceNotFoundException("CustomerOrder", orderId));
    }

    @Transactional
    public Payment recordSupplierPayment(Payment payment) {
        final UUID orgId = TenantContext.requireTenantId();
        final UUID userId = TenantContext.getUserId();

        if (payment.getAmount() == null || payment.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException("INVALID_AMOUNT", "Payment amount must be greater than zero");
        }

        Supplier supplier = findSupplierByIdAndOrg(payment.getSupplier().getId(), orgId);

        if (payment.getPaymentNumber() == null || payment.getPaymentNumber().trim().isEmpty()) {
            payment.setPaymentNumber("PAY-SUPP-" + System.currentTimeMillis() + "-" + UUID.randomUUID().toString().substring(0, 4).toUpperCase());
        }

        Organization organization = new Organization();
        organization.setId(orgId);

        payment.setSupplier(supplier);
        payment.setOrganization(organization);
        payment.setPaymentType(PaymentType.SUPPLIER_PAYMENT);
        payment.setRecordedBy(userId != null ? userRepository.findById(userId).orElse(null) : null);

        // Validate invoice and check overpayment if linked
        if (payment.getSupplierInvoice() != null && payment.getSupplierInvoice().getId() != null) {
            SupplierInvoice invoice = findSupplierInvoiceByIdAndOrg(payment.getSupplierInvoice().getId(), orgId);
            if (payment.getAmount().compareTo(invoice.getOutstandingAmount()) > 0) {
                throw new BusinessException("OVERPAYMENT_NOT_ALLOWED",
                        "Payment amount (" + payment.getAmount() + ") cannot exceed invoice outstanding balance (" + invoice.getOutstandingAmount() + ")");
            }
            invoice.setPaidAmount(invoice.getPaidAmount().add(payment.getAmount()));
            invoice.updateOutstanding();
            invoiceRepository.save(invoice);
        }

        payment = paymentRepository.save(payment);

        // Update supplier outstanding safely clamped to >= 0
        BigDecimal newSupplierBalance = supplier.getOutstandingAmount().subtract(payment.getAmount());
        if (newSupplierBalance.compareTo(BigDecimal.ZERO) < 0) {
            newSupplierBalance = BigDecimal.ZERO;
        }
        supplier.setOutstandingAmount(newSupplierBalance);
        supplierRepository.save(supplier);

        createBusinessEvent(payment, EventType.PAYMENT_MADE, "Supplier payment made: " + payment.getAmount());

        log.info("Recorded supplier payment: {} for supplier {}", payment.getAmount(), supplier.getName());
        return payment;
    }

    private Supplier findSupplierByIdAndOrg(UUID supplierId, UUID orgId) {
        return supplierRepository.findById(supplierId)
                .filter(s -> s.getOrganization().getId().equals(orgId))
                .orElseThrow(() -> new ResourceNotFoundException("Supplier", supplierId));
    }

    private SupplierInvoice findSupplierInvoiceByIdAndOrg(UUID invoiceId, UUID orgId) {
        return invoiceRepository.findById(invoiceId)
                .filter(i -> i.getOrganization().getId().equals(orgId))
                .orElseThrow(() -> new ResourceNotFoundException("SupplierInvoice", invoiceId));
    }

    @Transactional
    public Payment update(UUID id, Payment payment) {
        UUID orgId = TenantContext.requireTenantId();
        Payment existing = getById(id);

        // Don't allow changing type, amount, or linked entities
        existing.setPaymentDate(payment.getPaymentDate());
        existing.setPaymentMethod(payment.getPaymentMethod());
        existing.setReferenceNumber(payment.getReferenceNumber());
        existing.setNotes(payment.getNotes());

        return paymentRepository.save(existing);
    }

    @Transactional
    public void delete(UUID id) {
        final UUID orgId = TenantContext.requireTenantId();
        Payment payment = getById(id);

        // Reverse the effects
        if (payment.getPaymentType() == PaymentType.CUSTOMER_PAYMENT && payment.getCustomer() != null) {
            Customer customer = customerRepository.findById(payment.getCustomer().getId())
                    .filter(c -> c.getOrganization().getId().equals(orgId))
                    .orElse(null);
            if (customer != null) {
                customer.setOutstandingAmount(customer.getOutstandingAmount().add(payment.getAmount()));
                customerRepository.save(customer);
            }
            // Reverse order paid amount if linked
            if (payment.getCustomerOrder() != null) {
                CustomerOrder order = findCustomerOrderByIdAndOrg(payment.getCustomerOrder().getId(), orgId);
                BigDecimal newPaid = order.getPaidAmount().subtract(payment.getAmount());
                order.setPaidAmount(newPaid.compareTo(BigDecimal.ZERO) < 0 ? BigDecimal.ZERO : newPaid);
                order.updateOutstanding();
                orderRepository.save(order);
            }
        } else if (payment.getPaymentType() == PaymentType.SUPPLIER_PAYMENT && payment.getSupplier() != null) {
            Supplier supplier = supplierRepository.findById(payment.getSupplier().getId())
                    .filter(s -> s.getOrganization().getId().equals(orgId))
                    .orElse(null);
            if (supplier != null) {
                supplier.setOutstandingAmount(supplier.getOutstandingAmount().add(payment.getAmount()));
                supplierRepository.save(supplier);
            }
            // Reverse invoice paid amount if linked
            if (payment.getSupplierInvoice() != null) {
                SupplierInvoice invoice = findSupplierInvoiceByIdAndOrg(payment.getSupplierInvoice().getId(), orgId);
                BigDecimal newPaid = invoice.getPaidAmount().subtract(payment.getAmount());
                invoice.setPaidAmount(newPaid.compareTo(BigDecimal.ZERO) < 0 ? BigDecimal.ZERO : newPaid);
                invoice.updateOutstanding();
                invoiceRepository.save(invoice);
            }
        }

        paymentRepository.delete(payment);
        log.info("Deleted payment: {}", payment.getPaymentNumber());
    }

    private void createBusinessEvent(Payment payment, EventType eventType, String description) {
        UUID orgId = TenantContext.requireTenantId();
        BusinessEvent event = BusinessEvent.builder()
                .eventType(eventType)
                .entityType("PAYMENT")
                .entityId(payment.getId())
                .entityReference(payment.getPaymentNumber())
                .timestamp(Instant.now())
                .severity(EventSeverity.INFO)
                .description(description)
                .organization(new Organization() {{ setId(orgId); }})
                .build();
        businessEventRepository.save(event);
    }
}
