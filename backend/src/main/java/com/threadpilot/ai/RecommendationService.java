package com.threadpilot.ai;

import com.threadpilot.analytics.AnalyticsService;
import com.threadpilot.customer.Customer;
import com.threadpilot.customer.CustomerRepository;
import com.threadpilot.event.BusinessEventRepository;
import com.threadpilot.event.EventType;
import com.threadpilot.event.EventSeverity;
import com.threadpilot.inventory.Inventory;
import com.threadpilot.inventory.InventoryRepository;
import com.threadpilot.organization.Organization;
import com.threadpilot.product.ProductRepository;
import com.threadpilot.security.TenantContext;
import com.threadpilot.supplier.Supplier;
import com.threadpilot.supplier.SupplierRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
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
public class RecommendationService {

    private final AIRecommendationRepository recommendationRepository;
    private final InventoryRepository inventoryRepository;
    private final CustomerRepository customerRepository;
    private final SupplierRepository supplierRepository;
    private final ProductRepository productRepository;
    private final AnalyticsService analyticsService;
    private final BusinessEventRepository businessEventRepository;

    @Transactional(readOnly = true)
    public List<AIRecommendation> getPendingRecommendations() {
        UUID orgId = TenantContext.requireTenantId();
        return recommendationRepository.findPendingByOrganizationId(orgId);
    }

    @Transactional
    public void generateRecommendations() {
        UUID orgId = TenantContext.requireTenantId();
        log.info("Generating AI recommendations for organization: {}", orgId);

        generateLowStockRecommendations(orgId);
        generateSlowMovingRecommendations(orgId);
        generatePaymentFollowupRecommendations(orgId);
        generateCashFlowRecommendations(orgId);
    }

    private void generateLowStockRecommendations(UUID orgId) {
        List<Inventory> lowStock = inventoryRepository.findLowStock(orgId, 10);
        for (Inventory inv : lowStock) {
            String entityType = inv.getProduct() != null ? "PRODUCT" : "PRODUCT_VARIANT";
            UUID entityId = inv.getProduct() != null ? inv.getProduct().getId() : inv.getVariant().getId();
            String name = inv.getProduct() != null ? inv.getProduct().getName() : inv.getVariant().getSku();
            int reorderQty = inv.getProduct() != null ? inv.getProduct().getReorderQuantity() : inv.getVariant().getReorderQuantity();

            if (recommendationExists(entityType, entityId, RecommendationType.LOW_STOCK_REORDER, orgId)) {
                continue;
            }

            BigDecimal velocity = calculateSalesVelocity(entityId);
            int daysRemaining = velocity.compareTo(BigDecimal.ZERO) > 0
                    ? inv.getAvailableQuantity() / velocity.intValue()
                    : 999;

            String explanation = String.format(
                    "%s has only %d units available (minimum: %d). Current sales velocity: %.1f units/day. Estimated days of stock: %d. Recommended reorder: %d units.",
                    name, inv.getAvailableQuantity(),
                    inv.getProduct() != null ? inv.getProduct().getMinStockLevel() : inv.getVariant().getMinStockLevel(),
                    velocity, daysRemaining, reorderQty
            );

            AIRecommendation rec = AIRecommendation.builder()
                    .recommendationType(RecommendationType.LOW_STOCK_REORDER)
                    .severity(daysRemaining <= 3 ? RecommendationSeverity.CRITICAL : RecommendationSeverity.HIGH)
                    .status(RecommendationStatus.PENDING)
                    .title("Reorder: " + name)
                    .explanation(explanation)
                    .supportingData(toJson(java.util.Map.of(
                            "currentStock", inv.getAvailableQuantity(),
                            "minLevel", inv.getProduct() != null ? inv.getProduct().getMinStockLevel() : inv.getVariant().getMinStockLevel(),
                            "reorderQty", reorderQty,
                            "velocity", velocity,
                            "daysRemaining", daysRemaining
                    )))
                    .confidence(BigDecimal.valueOf(0.9))
                    .entityType(entityType)
                    .entityId(entityId)
                    .actionUrl("/inventory/" + entityId)
                    .actionLabel("View Inventory")
                    .estimatedImpact("Prevent stockout and lost sales")
                    .organization(new Organization() {{ setId(orgId); }})
                    .build();
            recommendationRepository.save(rec);
        }
    }

    private void generateSlowMovingRecommendations(UUID orgId) {
        List<Inventory> slowMoving = inventoryRepository.findWithStock(orgId).stream()
                .filter(i -> i.getCurrentQuantity() > 50 && i.getLastMovementAt() != null
                        && i.getLastMovementAt().isBefore(Instant.now().minusSeconds(90 * 24 * 60 * 60)))
                .limit(20)
                .toList();

        for (Inventory inv : slowMoving) {
            String entityType = inv.getProduct() != null ? "PRODUCT" : "PRODUCT_VARIANT";
            UUID entityId = inv.getProduct() != null ? inv.getProduct().getId() : inv.getVariant().getId();
            String name = inv.getProduct() != null ? inv.getProduct().getName() : inv.getVariant().getSku();

            if (recommendationExists(entityType, entityId, RecommendationType.SLOW_MOVING_ACTION, orgId)) {
                continue;
            }

            long daysSinceMovement = java.time.Duration.between(inv.getLastMovementAt(), Instant.now()).toDays();

            String explanation = String.format(
                    "%s has %d units in stock with no movement for %d days. Consider promotional pricing, bundling, or returning to supplier.",
                    name, inv.getCurrentQuantity(), daysSinceMovement
            );

            AIRecommendation rec = AIRecommendation.builder()
                    .recommendationType(RecommendationType.SLOW_MOVING_ACTION)
                    .severity(daysSinceMovement > 180 ? RecommendationSeverity.HIGH : RecommendationSeverity.MEDIUM)
                    .status(RecommendationStatus.PENDING)
                    .title("Slow Moving: " + name)
                    .explanation(explanation)
                    .supportingData(toJson(java.util.Map.of(
                            "currentStock", inv.getCurrentQuantity(),
                            "daysSinceMovement", daysSinceMovement,
                            "value", inv.getTotalValue()
                    )))
                    .confidence(BigDecimal.valueOf(0.85))
                    .entityType(entityType)
                    .entityId(entityId)
                    .actionUrl("/inventory/" + entityId)
                    .actionLabel("View Inventory")
                    .estimatedImpact("Free up capital and warehouse space")
                    .organization(new Organization() {{ setId(orgId); }})
                    .build();
            recommendationRepository.save(rec);
        }
    }

    private void generatePaymentFollowupRecommendations(UUID orgId) {
        List<Customer> overdue = customerRepository.findWithOutstandingActive(orgId);
        for (Customer customer : overdue) {
            if (customer.getOutstandingAmount().compareTo(BigDecimal.valueOf(50000)) >= 0) {
                String entityType = "CUSTOMER";
                UUID entityId = customer.getId();

                if (recommendationExists(entityType, entityId, RecommendationType.PAYMENT_FOLLOWUP, orgId)) {
                    continue;
                }

                String explanation = String.format(
                        "%s has ₹%s outstanding. Consider sending payment reminder or making collection call.",
                        customer.getName(), customer.getOutstandingAmount()
                );

                AIRecommendation rec = AIRecommendation.builder()
                        .recommendationType(RecommendationType.PAYMENT_FOLLOWUP)
                        .severity(customer.getOutstandingAmount().compareTo(BigDecimal.valueOf(100000)) > 0
                                ? RecommendationSeverity.CRITICAL : RecommendationSeverity.HIGH)
                        .status(RecommendationStatus.PENDING)
                        .title("Follow up: " + customer.getName())
                        .explanation(explanation)
                        .supportingData(toJson(java.util.Map.of(
                                "outstanding", customer.getOutstandingAmount(),
                                "creditLimit", customer.getCreditLimit()
                        )))
                        .confidence(BigDecimal.valueOf(0.95))
                        .entityType(entityType)
                        .entityId(entityId)
                        .actionUrl("/customers/" + entityId)
                        .actionLabel("View Customer")
                        .estimatedImpact("Improve cash flow by collecting overdue payments")
                        .organization(new Organization() {{ setId(orgId); }})
                        .build();
                recommendationRepository.save(rec);
            }
        }
    }

    private void generateCashFlowRecommendations(UUID orgId) {
        AnalyticsService.DashboardMetrics metrics = analyticsService.getDashboardMetrics();

        BigDecimal netPosition = metrics.getTotalReceivables().subtract(metrics.getTotalPayables());
        if (netPosition.compareTo(BigDecimal.ZERO) < 0) {
            if (!recommendationExists("ORGANIZATION", orgId, RecommendationType.CASH_FLOW_WARNING, orgId)) {
                String explanation = String.format(
                        "Upcoming payables (₹%s) exceed expected receivables (₹%s). Net position: ₹%s. Consider delaying non-critical payments or accelerating collections.",
                        metrics.getTotalPayables(), metrics.getTotalReceivables(), netPosition
                );

                AIRecommendation rec = AIRecommendation.builder()
                        .recommendationType(RecommendationType.CASH_FLOW_WARNING)
                        .severity(RecommendationSeverity.CRITICAL)
                        .status(RecommendationStatus.PENDING)
                        .title("Cash Flow Warning")
                        .explanation(explanation)
                        .supportingData(toJson(java.util.Map.of(
                                "receivables", metrics.getTotalReceivables(),
                                "payables", metrics.getTotalPayables(),
                                "netPosition", netPosition
                        )))
                        .confidence(BigDecimal.valueOf(0.9))
                        .entityType("ORGANIZATION")
                        .entityId(orgId)
                        .actionUrl("/analytics/cash-flow")
                        .actionLabel("View Cash Flow")
                        .estimatedImpact("Avoid liquidity crisis")
                        .organization(new Organization() {{ setId(orgId); }})
                        .build();
                recommendationRepository.save(rec);
            }
        }
    }

    private boolean recommendationExists(String entityType, UUID entityId, RecommendationType type, UUID orgId) {
        return recommendationRepository.findByEntity(orgId, entityType, entityId).stream()
                .anyMatch(r -> r.getRecommendationType() == type && r.getStatus() == RecommendationStatus.PENDING);
    }

    private BigDecimal calculateSalesVelocity(UUID entityId) {
        // Simplified - in production would query sales data
        return BigDecimal.valueOf(5); // mock 5 units/day
    }

    private String toJson(Object obj) {
        try {
            return new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(obj);
        } catch (Exception e) {
            return "{}";
        }
    }
}

