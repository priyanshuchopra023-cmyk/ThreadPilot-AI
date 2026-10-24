package com.threadpilot.inventory;

import com.threadpilot.organization.Organization;
import com.threadpilot.organization.OrganizationRepository;
import com.threadpilot.product.Product;
import com.threadpilot.product.ProductRepository;
import com.threadpilot.product.ProductStatus;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Integration tests for out-of-stock inventory detection.
 * 
 * BLOCKER: Requires PostgreSQL database via TestContainers (Docker).
 * Docker is not available in this environment.
 * 
 * To run: Install Docker, then remove @Disabled annotations.
 */
@Disabled("Requires Docker for TestContainers PostgreSQL")
@DataJpaTest
@ActiveProfiles("test")
class InventoryRepositoryOutOfStockTest {

    @Autowired
    private InventoryRepository inventoryRepository;

    @Autowired
    private OrganizationRepository organizationRepository;

    @Autowired
    private ProductRepository productRepository;

    @Test
    void findOutOfStock_returnsItemsWithZeroCurrentQuantity() {
        Organization org = organizationRepository.save(Organization.builder()
                .name("Test Org")
                .businessName("Test Business")
                .email("test@org.com")
                .isActive(true)
                .build());

        Product p1 = productRepository.save(Product.builder()
                .sku("SKU-001")
                .name("Product With Stock")
                .purchasePrice(BigDecimal.valueOf(10))
                .sellingPrice(BigDecimal.valueOf(20))
                .organization(org)
                .status(ProductStatus.ACTIVE)
                .build());

        Product p2 = productRepository.save(Product.builder()
                .sku("SKU-002")
                .name("Product Out Of Stock")
                .purchasePrice(BigDecimal.valueOf(15))
                .sellingPrice(BigDecimal.valueOf(30))
                .organization(org)
                .status(ProductStatus.ACTIVE)
                .build());

        Product p3 = productRepository.save(Product.builder()
                .sku("SKU-003")
                .name("Product Reserved But In Stock")
                .purchasePrice(BigDecimal.valueOf(20))
                .sellingPrice(BigDecimal.valueOf(40))
                .organization(org)
                .status(ProductStatus.ACTIVE)
                .build());

        inventoryRepository.save(com.threadpilot.inventory.Inventory.builder()
                .product(p1)
                .currentQuantity(50)
                .reservedQuantity(10)
                .availableQuantity(40)
                .incomingQuantity(0)
                .damagedQuantity(0)
                .returnedQuantity(0)
                .averageCost(BigDecimal.valueOf(10))
                .totalValue(BigDecimal.valueOf(500))
                .organization(org)
                .build());

        inventoryRepository.save(com.threadpilot.inventory.Inventory.builder()
                .product(p2)
                .currentQuantity(0)
                .reservedQuantity(0)
                .availableQuantity(0)
                .incomingQuantity(0)
                .damagedQuantity(0)
                .returnedQuantity(0)
                .averageCost(BigDecimal.valueOf(15))
                .totalValue(BigDecimal.ZERO)
                .organization(org)
                .build());

        inventoryRepository.save(com.threadpilot.inventory.Inventory.builder()
                .product(p3)
                .currentQuantity(100)
                .reservedQuantity(100)
                .availableQuantity(0)
                .incomingQuantity(0)
                .damagedQuantity(0)
                .returnedQuantity(0)
                .averageCost(BigDecimal.valueOf(20))
                .totalValue(BigDecimal.valueOf(2000))
                .organization(org)
                .build());

        List<com.threadpilot.inventory.Inventory> outOfStock = inventoryRepository.findOutOfStock(org.getId());

        assertThat(outOfStock).hasSize(1);
        assertThat(outOfStock.get(0).getProduct().getSku()).isEqualTo("SKU-002");
        assertThat(outOfStock.get(0).getCurrentQuantity()).isZero();
    }

    @Test
    void findOutOfStock_excludesReservedStockWithPositiveCurrentQuantity() {
        Organization org = organizationRepository.save(Organization.builder()
                .name("Test Org")
                .businessName("Test Business")
                .email("test@org.com")
                .isActive(true)
                .build());

        Product p = productRepository.save(Product.builder()
                .sku("SKU-RESERVED")
                .name("Fully Reserved Product")
                .purchasePrice(BigDecimal.valueOf(10))
                .sellingPrice(BigDecimal.valueOf(20))
                .organization(org)
                .status(ProductStatus.ACTIVE)
                .build());

        inventoryRepository.save(com.threadpilot.inventory.Inventory.builder()
                .product(p)
                .currentQuantity(50)
                .reservedQuantity(50)
                .availableQuantity(0)
                .incomingQuantity(0)
                .damagedQuantity(0)
                .returnedQuantity(0)
                .averageCost(BigDecimal.valueOf(10))
                .totalValue(BigDecimal.valueOf(500))
                .organization(org)
                .build());

        List<com.threadpilot.inventory.Inventory> outOfStock = inventoryRepository.findOutOfStock(org.getId());

        assertThat(outOfStock).isEmpty();
    }

    @Test
    void findOutOfStock_excludesOtherOrganizations() {
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

        Product p1 = productRepository.save(Product.builder()
                .sku("ORG1-OOS")
                .name("Org1 Out Of Stock")
                .purchasePrice(BigDecimal.valueOf(10))
                .sellingPrice(BigDecimal.valueOf(20))
                .organization(org1)
                .status(ProductStatus.ACTIVE)
                .build());

        Product p2 = productRepository.save(Product.builder()
                .sku("ORG2-OOS")
                .name("Org2 Out Of Stock")
                .purchasePrice(BigDecimal.valueOf(10))
                .sellingPrice(BigDecimal.valueOf(20))
                .organization(org2)
                .status(ProductStatus.ACTIVE)
                .build());

        inventoryRepository.save(com.threadpilot.inventory.Inventory.builder()
                .product(p1)
                .currentQuantity(0)
                .reservedQuantity(0)
                .availableQuantity(0)
                .averageCost(BigDecimal.valueOf(10))
                .totalValue(BigDecimal.ZERO)
                .organization(org1)
                .build());

        inventoryRepository.save(com.threadpilot.inventory.Inventory.builder()
                .product(p2)
                .currentQuantity(0)
                .reservedQuantity(0)
                .availableQuantity(0)
                .averageCost(BigDecimal.valueOf(10))
                .totalValue(BigDecimal.ZERO)
                .organization(org2)
                .build());

        List<com.threadpilot.inventory.Inventory> org1OutOfStock = inventoryRepository.findOutOfStock(org1.getId());
        List<com.threadpilot.inventory.Inventory> org2OutOfStock = inventoryRepository.findOutOfStock(org2.getId());

        assertThat(org1OutOfStock).hasSize(1);
        assertThat(org1OutOfStock.get(0).getProduct().getSku()).isEqualTo("ORG1-OOS");

        assertThat(org2OutOfStock).hasSize(1);
        assertThat(org2OutOfStock.get(0).getProduct().getSku()).isEqualTo("ORG2-OOS");
    }
}