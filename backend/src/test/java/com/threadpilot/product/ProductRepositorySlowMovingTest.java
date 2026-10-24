package com.threadpilot.product;

import com.threadpilot.organization.Organization;
import com.threadpilot.organization.OrganizationRepository;
import com.threadpilot.product.Product;
import com.threadpilot.product.ProductRepository;
import com.threadpilot.product.ProductStatus;
import com.threadpilot.sale.Sale;
import com.threadpilot.sale.SaleItem;
import com.threadpilot.sale.SaleRepository;
import com.threadpilot.user.User;
import com.threadpilot.user.UserRepository;
import com.threadpilot.user.UserStatus;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Integration tests for slow-moving product detection.
 * 
 * BLOCKER: Requires PostgreSQL database via TestContainers (Docker).
 * Docker is not available in this environment.
 * 
 * To run: Install Docker, then remove @Disabled annotations.
 */
@Disabled("Requires Docker for TestContainers PostgreSQL")
@DataJpaTest
@ActiveProfiles("test")
class ProductRepositorySlowMovingTest {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private OrganizationRepository organizationRepository;

    @Autowired
    private SaleRepository saleRepository;

    @Autowired
    private UserRepository userRepository;

    @Test
    void findSlowMoving_returnsProductsWithNoSalesInWindow() {
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
                .status(UserStatus.ACTIVE)
                .build());

        Product p1 = productRepository.save(Product.builder()
                .sku("SLOW-001")
                .name("Slow Moving Product")
                .purchasePrice(BigDecimal.valueOf(10))
                .sellingPrice(BigDecimal.valueOf(20))
                .organization(org)
                .status(ProductStatus.ACTIVE)
                .build());

        Product p2 = productRepository.save(Product.builder()
                .sku("ACTIVE-001")
                .name("Active Product")
                .purchasePrice(BigDecimal.valueOf(15))
                .sellingPrice(BigDecimal.valueOf(30))
                .organization(org)
                .status(ProductStatus.ACTIVE)
                .build());

        Product p3 = productRepository.save(Product.builder()
                .sku("SLOW-002")
                .name("Also Slow Moving")
                .purchasePrice(BigDecimal.valueOf(20))
                .sellingPrice(BigDecimal.valueOf(40))
                .organization(org)
                .status(ProductStatus.ACTIVE)
                .build());

        Sale sale = Sale.builder()
                .saleNumber("SALE-001")
                .saleDate(LocalDate.now().minusDays(10))
                .subtotal(BigDecimal.valueOf(30))
                .taxAmount(BigDecimal.ZERO)
                .discountAmount(BigDecimal.ZERO)
                .totalAmount(BigDecimal.valueOf(30))
                .costAmount(BigDecimal.valueOf(15))
                .grossProfit(BigDecimal.valueOf(15))
                .organization(org)
                .createdBy(user)
                .items(Set.of(SaleItem.builder()
                        .product(p2)
                        .quantity(1)
                        .unitPrice(BigDecimal.valueOf(30))
                        .unitCost(BigDecimal.valueOf(15))
                        .taxRate(BigDecimal.ZERO)
                        .discountRate(BigDecimal.ZERO)
                        .lineTotal(BigDecimal.valueOf(30))
                        .costAmount(BigDecimal.valueOf(15))
                        .build()))
                .build();
        saleRepository.save(sale);

        LocalDate sinceDate = LocalDate.now().minusDays(90);

        List<Product> slowMoving = productRepository.findSlowMoving(org.getId(), sinceDate, PageRequest.of(0, 10));

        assertThat(slowMoving).hasSize(2);
        assertThat(slowMoving).extracting(Product::getSku).containsExactlyInAnyOrder("SLOW-001", "SLOW-002");
    }

    @Test
    void findSlowMoving_excludesProductsWithSalesInWindow() {
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
                .status(UserStatus.ACTIVE)
                .build());

        Product p = productRepository.save(Product.builder()
                .sku("RECENT-SALE")
                .name("Recent Sale Product")
                .purchasePrice(BigDecimal.valueOf(10))
                .sellingPrice(BigDecimal.valueOf(20))
                .organization(org)
                .status(ProductStatus.ACTIVE)
                .build());

        Sale sale = Sale.builder()
                .saleNumber("SALE-002")
                .saleDate(LocalDate.now().minusDays(5))
                .subtotal(BigDecimal.valueOf(20))
                .taxAmount(BigDecimal.ZERO)
                .discountAmount(BigDecimal.ZERO)
                .totalAmount(BigDecimal.valueOf(20))
                .costAmount(BigDecimal.valueOf(10))
                .grossProfit(BigDecimal.valueOf(10))
                .organization(org)
                .createdBy(user)
                .items(Set.of(SaleItem.builder()
                        .product(p)
                        .quantity(1)
                        .unitPrice(BigDecimal.valueOf(20))
                        .unitCost(BigDecimal.valueOf(10))
                        .taxRate(BigDecimal.ZERO)
                        .discountRate(BigDecimal.ZERO)
                        .lineTotal(BigDecimal.valueOf(20))
                        .costAmount(BigDecimal.valueOf(10))
                        .build()))
                .build();
        saleRepository.save(sale);

        LocalDate sinceDate = LocalDate.now().minusDays(90);

        List<Product> slowMoving = productRepository.findSlowMoving(org.getId(), sinceDate, PageRequest.of(0, 10));

        assertThat(slowMoving).isEmpty();
    }

    @Test
    void findSlowMoving_excludesOtherOrganizations() {
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

        User user = userRepository.save(User.builder()
                .firstName("Test")
                .lastName("User")
                .email("user@test.com")
                .passwordHash("hash")
                .organization(org1)
                .status(UserStatus.ACTIVE)
                .build());

        Product p1 = productRepository.save(Product.builder()
                .sku("ORG1-SLOW")
                .name("Org1 Slow Product")
                .purchasePrice(BigDecimal.valueOf(10))
                .sellingPrice(BigDecimal.valueOf(20))
                .organization(org1)
                .status(ProductStatus.ACTIVE)
                .build());

        Product p2 = productRepository.save(Product.builder()
                .sku("ORG2-SLOW")
                .name("Org2 Slow Product")
                .purchasePrice(BigDecimal.valueOf(10))
                .sellingPrice(BigDecimal.valueOf(20))
                .organization(org2)
                .status(ProductStatus.ACTIVE)
                .build());

        Sale sale = Sale.builder()
                .saleNumber("SALE-003")
                .saleDate(LocalDate.now().minusDays(5))
                .subtotal(BigDecimal.valueOf(20))
                .taxAmount(BigDecimal.ZERO)
                .discountAmount(BigDecimal.ZERO)
                .totalAmount(BigDecimal.valueOf(20))
                .costAmount(BigDecimal.valueOf(10))
                .grossProfit(BigDecimal.valueOf(10))
                .organization(org1)
                .createdBy(user)
                .items(Set.of(SaleItem.builder()
                        .product(p1)
                        .quantity(1)
                        .unitPrice(BigDecimal.valueOf(20))
                        .unitCost(BigDecimal.valueOf(10))
                        .taxRate(BigDecimal.ZERO)
                        .discountRate(BigDecimal.ZERO)
                        .lineTotal(BigDecimal.valueOf(20))
                        .costAmount(BigDecimal.valueOf(10))
                        .build()))
                .build();
        saleRepository.save(sale);

        LocalDate sinceDate = LocalDate.now().minusDays(90);

        List<Product> org1Slow = productRepository.findSlowMoving(org1.getId(), sinceDate, PageRequest.of(0, 10));
        List<Product> org2Slow = productRepository.findSlowMoving(org2.getId(), sinceDate, PageRequest.of(0, 10));

        assertThat(org1Slow).isEmpty();
        assertThat(org2Slow).hasSize(1);
        assertThat(org2Slow.get(0).getSku()).isEqualTo("ORG2-SLOW");
    }

    @Test
    void findSlowMoving_excludesInactiveProducts() {
        Organization org = organizationRepository.save(Organization.builder()
                .name("Test Org")
                .businessName("Test Business")
                .email("test@org.com")
                .isActive(true)
                .build());

        Product p1 = productRepository.save(Product.builder()
                .sku("INACTIVE")
                .name("Inactive Product")
                .purchasePrice(BigDecimal.valueOf(10))
                .sellingPrice(BigDecimal.valueOf(20))
                .organization(org)
                .status(ProductStatus.DISCONTINUED)
                .build());

        Product p2 = productRepository.save(Product.builder()
                .sku("ACTIVE-SLOW")
                .name("Active Slow Product")
                .purchasePrice(BigDecimal.valueOf(10))
                .sellingPrice(BigDecimal.valueOf(20))
                .organization(org)
                .status(ProductStatus.ACTIVE)
                .build());

        LocalDate sinceDate = LocalDate.now().minusDays(90);

        List<Product> slowMoving = productRepository.findSlowMoving(org.getId(), sinceDate, PageRequest.of(0, 10));

        assertThat(slowMoving).hasSize(1);
        assertThat(slowMoving.get(0).getSku()).isEqualTo("ACTIVE-SLOW");
    }
}