package com.threadpilot.inventory;

import com.threadpilot.common.dto.PageResponse;
import com.threadpilot.common.dto.PaginationRequest;
import com.threadpilot.common.exception.BusinessException;
import com.threadpilot.common.exception.ResourceNotFoundException;
import com.threadpilot.event.BusinessEvent;
import com.threadpilot.event.BusinessEventRepository;
import com.threadpilot.event.EventType;
import com.threadpilot.event.EventSeverity;
import com.threadpilot.organization.Organization;
import com.threadpilot.product.Product;
import com.threadpilot.product.ProductRepository;
import com.threadpilot.product.ProductVariant;
import com.threadpilot.product.ProductVariantRepository;
import com.threadpilot.security.TenantContext;
import com.threadpilot.user.User;
import com.threadpilot.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class InventoryService {

    private final InventoryRepository inventoryRepository;
    private final StockMovementRepository stockMovementRepository;
    private final ProductRepository productRepository;
    private final ProductVariantRepository variantRepository;
    private final UserRepository userRepository;
    private final BusinessEventRepository businessEventRepository;

    @Transactional(readOnly = true)
    public PageResponse<Inventory> getAll(PaginationRequest request) {
        UUID orgId = TenantContext.requireTenantId();
        Page<Inventory> page = inventoryRepository.findByOrganizationId(orgId, request.toPageable());
        return PageResponse.of(page);
    }

    @Transactional(readOnly = true)
    public Inventory getByProductId(UUID productId) {
        UUID orgId = TenantContext.requireTenantId();
        return inventoryRepository.findByProductIdAndOrganizationId(productId, orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory", "productId", productId));
    }

    @Transactional(readOnly = true)
    public Inventory getByVariantId(UUID variantId) {
        UUID orgId = TenantContext.requireTenantId();
        return inventoryRepository.findByVariantIdAndOrganizationId(variantId, orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory", "variantId", variantId));
    }

    @Transactional(readOnly = true)
    public List<Inventory> getLowStock(int threshold) {
        UUID orgId = TenantContext.requireTenantId();
        return inventoryRepository.findLowStock(orgId, threshold);
    }

    @Transactional(readOnly = true)
    public List<Inventory> getOutOfStock() {
        UUID orgId = TenantContext.requireTenantId();
        return inventoryRepository.findOutOfStock(orgId);
    }

    @Transactional(readOnly = true)
    public BigDecimal getTotalInventoryValue() {
        UUID orgId = TenantContext.requireTenantId();
        return inventoryRepository.getTotalInventoryValue(orgId);
    }

    @Transactional(readOnly = true)
    public PageResponse<StockMovement> getMovements(PaginationRequest request) {
        UUID orgId = TenantContext.requireTenantId();
        Page<StockMovement> page = stockMovementRepository.findByOrganizationId(orgId, request.toPageable());
        return PageResponse.of(page);
    }

    @Transactional(readOnly = true)
    public PageResponse<StockMovement> getMovementsByProduct(UUID productId, PaginationRequest request) {
        UUID orgId = TenantContext.requireTenantId();
        Page<StockMovement> page = stockMovementRepository.findByProductId(productId, orgId, request.toPageable());
        return PageResponse.of(page);
    }

    @Transactional(readOnly = true)
    public PageResponse<StockMovement> getMovementsByVariant(UUID variantId, PaginationRequest request) {
        UUID orgId = TenantContext.requireTenantId();
        Page<StockMovement> page = stockMovementRepository.findByVariantId(variantId, orgId, request.toPageable());
        return PageResponse.of(page);
    }

    @Transactional
    public StockMovement adjustStock(UUID productId, UUID variantId, int quantity, MovementType type, String notes, String referenceType, UUID referenceId, String referenceNumber) {
        UUID orgId = TenantContext.requireTenantId();
        UUID userId = TenantContext.getUserId();

        Inventory inventory;
        Product product = null;
        ProductVariant variant = null;

        if (productId != null) {
            inventory = inventoryRepository.findByProductIdAndOrganizationId(productId, orgId)
                    .orElseThrow(() -> new ResourceNotFoundException("Inventory", "productId", productId));
            product = productRepository.findById(productId).orElse(null);
        } else if (variantId != null) {
            inventory = inventoryRepository.findByVariantIdAndOrganizationId(variantId, orgId)
                    .orElseThrow(() -> new ResourceNotFoundException("Inventory", "variantId", variantId));
            variant = variantRepository.findById(variantId).orElse(null);
        } else {
            throw new BusinessException("INVALID_REQUEST", "Either productId or variantId must be provided");
        }

        int quantityBefore = inventory.getCurrentQuantity();
        int quantityAfter;

        switch (type) {
            case PURCHASE, INITIAL_STOCK, RETURN -> {
                quantityAfter = quantityBefore + quantity;
                inventory.setCurrentQuantity(quantityAfter);
            }
            case SALE, DAMAGE -> {
                if (inventory.getAvailableQuantity() < quantity) {
                    throw new BusinessException("INSUFFICIENT_STOCK", "Insufficient available stock");
                }
                quantityAfter = quantityBefore - quantity;
                inventory.setCurrentQuantity(quantityAfter);
            }
            case ADJUSTMENT -> {
                quantityAfter = quantity;
                inventory.setCurrentQuantity(quantityAfter);
            }
            case TRANSFER -> {
                quantityAfter = quantityBefore + quantity;
                inventory.setCurrentQuantity(quantityAfter);
            }
            default -> throw new BusinessException("INVALID_MOVEMENT_TYPE", "Unsupported movement type: " + type);
        }

        inventory.recalculateAvailable();
        inventory.recalculateTotalValue();
        inventory.setLastMovementAt(Instant.now());
        inventoryRepository.save(inventory);

        StockMovement movement = StockMovement.builder()
                .movementType(type)
                .quantity(quantity)
                .quantityBefore(quantityBefore)
                .quantityAfter(quantityAfter)
                .unitCost(product != null ? product.getPurchasePrice() : (variant != null ? variant.getPurchasePrice() : BigDecimal.ZERO))
                .referenceType(referenceType)
                .referenceId(referenceId)
                .referenceNumber(referenceNumber)
                .notes(notes)
                .product(product)
                .variant(variant)
                .organization(new Organization() {{ setId(orgId); }})
                .createdBy(userId != null ? userRepository.findById(userId).orElse(null) : null)
                .build();
        stockMovementRepository.save(movement);

        // Create business event
        createBusinessEvent(product, variant, type, quantity, quantityBefore, quantityAfter, referenceType, referenceId, notes);

        log.info("Stock adjusted: product={}, variant={}, type={}, qty={}, before={}, after={}",
                productId, variantId, type, quantity, quantityBefore, quantityAfter);

        return movement;
    }

    @Transactional
    public void reserveStock(UUID productId, UUID variantId, int quantity, String referenceType, UUID referenceId) {
        UUID orgId = TenantContext.requireTenantId();

        Inventory inventory;
        if (productId != null) {
            inventory = inventoryRepository.findByProductIdAndOrganizationId(productId, orgId)
                    .orElseThrow(() -> new ResourceNotFoundException("Inventory", "productId", productId));
        } else {
            inventory = inventoryRepository.findByVariantIdAndOrganizationId(variantId, orgId)
                    .orElseThrow(() -> new ResourceNotFoundException("Inventory", "variantId", variantId));
        }

        if (!inventory.canReserve(quantity)) {
            throw new BusinessException("INSUFFICIENT_STOCK", "Insufficient available stock to reserve");
        }

        inventory.reserve(quantity);
        inventoryRepository.save(inventory);

        StockMovement movement = StockMovement.builder()
                .movementType(MovementType.RESERVATION)
                .quantity(quantity)
                .quantityBefore(inventory.getCurrentQuantity())
                .quantityAfter(inventory.getCurrentQuantity())
                .referenceType(referenceType)
                .referenceId(referenceId)
                .notes("Reserved for " + referenceType)
                .product(productId != null ? productRepository.findById(productId).orElse(null) : null)
                .variant(variantId != null ? variantRepository.findById(variantId).orElse(null) : null)
                .organization(new Organization() {{ setId(orgId); }})
                .build();
        stockMovementRepository.save(movement);
    }

    @Transactional
    public void releaseReservation(UUID productId, UUID variantId, int quantity, String referenceType, UUID referenceId) {
        UUID orgId = TenantContext.requireTenantId();

        Inventory inventory;
        if (productId != null) {
            inventory = inventoryRepository.findByProductIdAndOrganizationId(productId, orgId)
                    .orElseThrow(() -> new ResourceNotFoundException("Inventory", "productId", productId));
        } else {
            inventory = inventoryRepository.findByVariantIdAndOrganizationId(variantId, orgId)
                    .orElseThrow(() -> new ResourceNotFoundException("Inventory", "variantId", variantId));
        }

        inventory.releaseReservation(quantity);
        inventoryRepository.save(inventory);

        StockMovement movement = StockMovement.builder()
                .movementType(MovementType.RELEASE_RESERVATION)
                .quantity(quantity)
                .quantityBefore(inventory.getCurrentQuantity())
                .quantityAfter(inventory.getCurrentQuantity())
                .referenceType(referenceType)
                .referenceId(referenceId)
                .notes("Released reservation for " + referenceType)
                .product(productId != null ? productRepository.findById(productId).orElse(null) : null)
                .variant(variantId != null ? variantRepository.findById(variantId).orElse(null) : null)
                .organization(new Organization() {{ setId(orgId); }})
                .build();
        stockMovementRepository.save(movement);
    }

    @Transactional
    public void confirmSale(UUID productId, UUID variantId, int quantity, String referenceType, UUID referenceId) {
        UUID orgId = TenantContext.requireTenantId();

        Inventory inventory;
        if (productId != null) {
            inventory = inventoryRepository.findByProductIdAndOrganizationId(productId, orgId)
                    .orElseThrow(() -> new ResourceNotFoundException("Inventory", "productId", productId));
        } else {
            inventory = inventoryRepository.findByVariantIdAndOrganizationId(variantId, orgId)
                    .orElseThrow(() -> new ResourceNotFoundException("Inventory", "variantId", variantId));
        }

        inventory.confirmSale(quantity);
        inventoryRepository.save(inventory);

        StockMovement movement = StockMovement.builder()
                .movementType(MovementType.SALE)
                .quantity(quantity)
                .quantityBefore(inventory.getCurrentQuantity() + quantity)
                .quantityAfter(inventory.getCurrentQuantity())
                .referenceType(referenceType)
                .referenceId(referenceId)
                .notes("Sale confirmed")
                .product(productId != null ? productRepository.findById(productId).orElse(null) : null)
                .variant(variantId != null ? variantRepository.findById(variantId).orElse(null) : null)
                .organization(new Organization() {{ setId(orgId); }})
                .build();
        stockMovementRepository.save(movement);
    }

    private void createBusinessEvent(Product product, ProductVariant variant, MovementType type, int quantity, int before, int after, String refType, UUID refId, String notes) {
        UUID orgId = TenantContext.requireTenantId();
        String entityType = product != null ? "PRODUCT" : "PRODUCT_VARIANT";
        UUID entityId = product != null ? product.getId() : variant.getId();

        EventType eventType = switch (type) {
            case PURCHASE -> EventType.STOCK_RECEIVED;
            case SALE -> EventType.STOCK_SOLD;
            case RETURN -> EventType.STOCK_RETURNED;
            case DAMAGE -> EventType.STOCK_DAMAGED;
            case ADJUSTMENT -> EventType.STOCK_ADJUSTED;
            case TRANSFER -> EventType.STOCK_TRANSFERRED;
            case INITIAL_STOCK -> EventType.STOCK_RECEIVED;
            case RESERVATION -> EventType.STOCK_RESERVED;
            case RELEASE_RESERVATION -> EventType.STOCK_RESERVATION_RELEASED;
        };

        BusinessEvent event = BusinessEvent.builder()
                .eventType(eventType)
                .entityType(entityType)
                .entityId(entityId)
                .timestamp(Instant.now())
                .severity(EventSeverity.INFO)
                .description(String.format("Stock %s: %d units (before: %d, after: %d)", type.name().toLowerCase(), quantity, before, after))
                .organization(new Organization() {{ setId(orgId); }})
                .build();
        businessEventRepository.save(event);
    }
}

