package com.threadpilot.customer;

import com.threadpilot.organization.Organization;
import com.threadpilot.organization.OrganizationRepository;
import com.threadpilot.user.User;
import com.threadpilot.user.UserRepository;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Integration tests for receivables calculation.
 * 
 * BLOCKER: Requires PostgreSQL database via TestContainers (Docker).
 * Docker is not available in this environment.
 * 
 * To run: Install Docker, then remove @Disabled annotations.
 */
@Disabled("Requires Docker for TestContainers PostgreSQL")
@DataJpaTest
@ActiveProfiles("test")
class CustomerRepositoryReceivablesTest {

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private OrganizationRepository organizationRepository;

    @Autowired
    private UserRepository userRepository;

    @Test
    void getTotalOutstanding_returnsSumOfOutstandingAmountsForOrganization() {
        Organization org = organizationRepository.save(Organization.builder()
                .name("Test Org")
                .businessName("Test Business")
                .email("test@org.com")
                .isActive(true)
                .build());

        User user = userRepository.save(User.builder()
                .firstName("Test")
                .lastName("User")
                .email("user@test.com")
                .passwordHash("hash")
                .organization(org)
                .status(com.threadpilot.user.UserStatus.ACTIVE)
                .build());

        Customer c1 = customerRepository.save(Customer.builder()
                .name("Customer One")
                .email("c1@test.com")
                .outstandingAmount(BigDecimal.valueOf(1000))
                .creditLimit(BigDecimal.valueOf(5000))
                .organization(org)
                .status(CustomerStatus.ACTIVE)
                .build());

        Customer c2 = customerRepository.save(Customer.builder()
                .name("Customer Two")
                .email("c2@test.com")
                .outstandingAmount(BigDecimal.valueOf(2500))
                .creditLimit(BigDecimal.valueOf(10000))
                .organization(org)
                .status(CustomerStatus.ACTIVE)
                .build());

        Customer c3 = customerRepository.save(Customer.builder()
                .name("Customer Three")
                .email("c3@test.com")
                .outstandingAmount(BigDecimal.ZERO)
                .creditLimit(BigDecimal.valueOf(5000))
                .organization(org)
                .status(CustomerStatus.ACTIVE)
                .build());

        Organization org2 = organizationRepository.save(Organization.builder()
                .name("Other Org")
                .businessName("Other Business")
                .email("other@org.com")
                .isActive(true)
                .build());

        Customer c4 = customerRepository.save(Customer.builder()
                .name("Other Org Customer")
                .email("c4@test.com")
                .outstandingAmount(BigDecimal.valueOf(9999))
                .creditLimit(BigDecimal.valueOf(20000))
                .organization(org2)
                .status(CustomerStatus.ACTIVE)
                .build());

        BigDecimal total = customerRepository.getTotalOutstanding(org.getId());

        assertThat(total).isEqualByComparingTo(BigDecimal.valueOf(3500));
    }

    @Test
    void getTotalOutstanding_returnsZeroWhenNoCustomers() {
        Organization org = organizationRepository.save(Organization.builder()
                .name("Empty Org")
                .businessName("Empty Business")
                .email("empty@org.com")
                .isActive(true)
                .build());

        BigDecimal total = customerRepository.getTotalOutstanding(org.getId());

        assertThat(total).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    void getTotalOutstanding_excludesOtherOrganizations() {
        Organization org1 = organizationRepository.save(Organization.builder()
                .name("Org One")
                .businessName("Business One")
                .email("org1@test.com")
                .isActive(true)
                .build());

        Organization org2 = organizationRepository.save(Organization.builder()
                .name("Org Two")
                .businessName("Business Two")
                .email("org2@test.com")
                .isActive(true)
                .build());

        customerRepository.save(Customer.builder()
                .name("Org1 Customer")
                .email("org1c@test.com")
                .outstandingAmount(BigDecimal.valueOf(500))
                .creditLimit(BigDecimal.valueOf(1000))
                .organization(org1)
                .status(CustomerStatus.ACTIVE)
                .build());

        customerRepository.save(Customer.builder()
                .name("Org2 Customer")
                .email("org2c@test.com")
                .outstandingAmount(BigDecimal.valueOf(5000))
                .creditLimit(BigDecimal.valueOf(10000))
                .organization(org2)
                .status(CustomerStatus.ACTIVE)
                .build());

        BigDecimal org1Total = customerRepository.getTotalOutstanding(org1.getId());
        BigDecimal org2Total = customerRepository.getTotalOutstanding(org2.getId());

        assertThat(org1Total).isEqualByComparingTo(BigDecimal.valueOf(500));
        assertThat(org2Total).isEqualByComparingTo(BigDecimal.valueOf(5000));
    }
}