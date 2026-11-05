package com.threadpilot.ai;

import com.threadpilot.analytics.AnalyticsService;
import com.threadpilot.security.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class MockAIProvider implements AIProvider {

    private final BusinessContextService businessContextService;
    private final AnalyticsService analyticsService;

    @Override
    public String getName() {
        return "mock";
    }

    @Override
    public String getDefaultModel() {
        return "mock-model";
    }

    @Override
    public AIChatResponse chat(AIChatRequest request) {
        log.info("Mock AI chat request with {} messages", request.messages().size());
        String lastMessage = request.messages().isEmpty() ? "" : request.messages().get(request.messages().size() - 1).content();
        String response = generateGroundedResponse(lastMessage);

        return new AIChatResponse(
                "mock-" + System.currentTimeMillis(),
                "mock-model",
                List.of(new AIChoice(0, new AIMessage("assistant", response, null, null), "stop")),
                new AIUsage(100, 100, 200)
        );
    }

    @Override
    public AIRecommendationResponse generateRecommendation(AIRecommendationRequest request) {
        return new AIRecommendationResponse(
                "Recommendation for " + request.recommendationType(),
                "AI business brain operational recommendation grounded in real ledger data.",
                0.90,
                "Verified system metrics"
        );
    }

    @Override
    public AIAnalysisResponse analyzeBusinessContext(AIAnalysisRequest request) {
        return new AIAnalysisResponse(
                "Business Brain Analysis for: " + request.question(),
                List.of("General Ledger", "Inventory Ledger", "Sales Records"),
                0.95
        );
    }

    @Override
    public boolean isAvailable() {
        return true;
    }

    @Override
    public void validateConfiguration() {
    }

    private String generateGroundedResponse(String userMessage) {
        String lower = userMessage.toLowerCase();

        BusinessContextService.BusinessContext ctx = null;
        if (TenantContext.hasTenant()) {
            try {
                ctx = businessContextService.getBusinessContext();
            } catch (Exception e) {
                log.warn("Could not retrieve business context for grounding: {}", e.getMessage());
            }
        }

        if (lower.contains("draft") || lower.contains("reminder") || lower.contains("follow up") || lower.contains("whatsapp") || lower.contains("message")) {
            if (ctx != null && ctx.getTopCustomersByOutstanding() != null && !ctx.getTopCustomersByOutstanding().isEmpty()) {
                var cust = ctx.getTopCustomersByOutstanding().get(0);
                return "### Verified Facts (Live Ledger)\n" +
                        "• Customer: " + cust.getName() + "\n" +
                        "• Outstanding Balance: ₹" + cust.getOutstandingAmount() + "\n" +
                        "• Approved Credit Limit: ₹" + cust.getCreditLimit() + "\n\n" +
                        "### Reasons & Supporting Records\n" +
                        "• Source: Live Customer Ledger & Outstanding Invoices\n" +
                        "• Context: Outstanding balance is due according to agreed credit terms.\n\n" +
                        "### Suggested Draft Follow-up Message (Pending Human Review)\n" +
                        "*Channel: WhatsApp / Email*\n" +
                        "```text\n" +
                        "Dear " + cust.getName() + ",\n" +
                        "Greetings from ThreadPilot. This is a gentle reminder regarding the outstanding balance of ₹" +
                        cust.getOutstandingAmount() + " on your account.\n" +
                        "Kindly confirm when this payment is scheduled or reply with your payment receipt if already processed.\n" +
                        "Thank you for your ongoing partnership!\n" +
                        "```\n\n" +
                        "> [!IMPORTANT]\n" +
                        "> **Human Authorization Notice:** This draft is generated for your review. Thread AI does not execute automatic communications or dispatch messages without your explicit confirmation.";
            } else {
                return "All customer accounts currently have zero outstanding debt. No collection follow-up drafts required.";
            }
        }

        if (lower.contains("aging") || lower.contains("due date") || lower.contains("receivables aging")) {
            try {
                var aging = analyticsService.getReceivablesAging();
                StringBuilder sb = new StringBuilder("### Verified Receivables Aging (Based on Invoice Due Dates)\n");
                sb.append(String.format("• Current (Within terms / 0-30 days): ₹%s\n", aging.getCurrent0To30()));
                sb.append(String.format("• Overdue 31–60 days: ₹%s\n", aging.getOverdue31To60()));
                sb.append(String.format("• Overdue 61–90 days: ₹%s\n", aging.getOverdue61To90()));
                sb.append(String.format("• Overdue 90+ days: ₹%s\n", aging.getOverdue90Plus()));
                sb.append(String.format("• **Total Outstanding Receivables:** ₹%s\n\n", aging.getTotalReceivables()));

                if (aging.getCustomerSummaries() != null && !aging.getCustomerSummaries().isEmpty()) {
                    sb.append("#### Customer Overdue Breakdown:\n");
                    for (var cs : aging.getCustomerSummaries()) {
                        sb.append(String.format("- **%s**: Outstanding ₹%s | Max overdue: %d days | Earliest Due Date: %s\n",
                                cs.getCustomerName(), cs.getOutstanding(), cs.getDaysOverdue(),
                                cs.getEarliestDueDate() != null ? cs.getEarliestDueDate() : "Standard Terms"));
                    }
                }
                return sb.toString();
            } catch (Exception e) {
                log.warn("Error getting aging in mock provider: {}", e.getMessage());
            }
        }

        if (lower.contains("action") || lower.contains("priority") || lower.contains("task") || lower.contains("to-do")) {
            try {
                var actions = analyticsService.getDailyActionCenter();
                if (actions != null && !actions.isEmpty()) {
                    StringBuilder sb = new StringBuilder("### Daily Prioritized Business Actions\n\n");
                    int idx = 1;
                    for (var a : actions) {
                        String impactStr = a.getFinancialImpact() != null ? " (Financial Impact: ₹" + a.getFinancialImpact() + ")" : "";
                        sb.append(String.format("%d. [%s] **%s**%s\n   - Reason: %s\n   - Link: [%s](%s)\n",
                                idx++, a.getPriority(), a.getTitle(), impactStr, a.getReason(), a.getEntityType(), a.getActionUrl()));
                    }
                    return sb.toString();
                } else {
                    return "No urgent business actions pending today. All stock, receivables, and payables are within normal thresholds.";
                }
            } catch (Exception e) {
                log.warn("Error getting action center in mock provider: {}", e.getMessage());
            }
        }

        if (lower.contains("textile") || lower.contains("hosiery") || lower.contains("yarn") || lower.contains("velocity") || lower.contains("trend")) {
            try {
                var textileIntel = analyticsService.getTextileProductIntelligence();
                if (textileIntel != null && !textileIntel.isEmpty()) {
                    StringBuilder sb = new StringBuilder("### Textile & Hosiery Inventory Intelligence\n\n");
                    for (var item : textileIntel) {
                        sb.append(String.format("• **%s** (%s) — Trend: `%s` | Quality: `%s`\n",
                                item.getProductName(), item.getSku(), item.getDemandTrend(), item.getDataQualityStatus()));
                        sb.append(String.format("  - Current Stock: %d | 30-day Sales: %d units (Velocity: %s units/day)\n",
                                item.getCurrentStock(), item.getUnitsSold30Days(), item.getDailyVelocity()));
                        if (item.getDaysOfStock() != null) {
                            sb.append(String.format("  - Stock Coverage: ~%d days\n", item.getDaysOfStock()));
                        }
                        sb.append("  - Recommendation: ").append(item.getRecommendation()).append("\n\n");
                    }
                    return sb.toString();
                } else {
                    return "No active textile products registered for velocity analysis.";
                }
            } catch (Exception e) {
                log.warn("Error getting textile intelligence in mock provider: {}", e.getMessage());
            }
        }

        if (lower.contains("low stock") || lower.contains("running low") || lower.contains("stock level")) {
            if (ctx != null && ctx.getLowStockProducts() != null && !ctx.getLowStockProducts().isEmpty()) {
                StringBuilder sb = new StringBuilder("Based on live inventory records, the following items are below minimum stock thresholds:\n");
                int idx = 1;
                for (var inv : ctx.getLowStockProducts()) {
                    String name = inv.getProduct() != null ? inv.getProduct().getName() : (inv.getVariant() != null ? inv.getVariant().getSku() : "Item");
                    int min = inv.getProduct() != null ? inv.getProduct().getMinStockLevel() : (inv.getVariant() != null ? inv.getVariant().getMinStockLevel() : 10);
                    sb.append(String.format("%d. %s — Available: %d (Minimum threshold: %d)\n", idx++, name, inv.getAvailableQuantity(), min));
                }
                sb.append("\nRecommendation: Review supplier pricing and generate purchase orders for depleted stock.");
                return sb.toString();
            } else {
                return "Inventory status: All stock levels are currently healthy and meet or exceed configured reorder thresholds.";
            }
        }

        if (lower.contains("owe") || lower.contains("outstanding") || lower.contains("overdue") || lower.contains("receivable")) {
            if (ctx != null && ctx.getTopCustomersByOutstanding() != null && !ctx.getTopCustomersByOutstanding().isEmpty()) {
                StringBuilder sb = new StringBuilder("Customer receivables and overdue status (Live Ledger):\n");
                int idx = 1;
                for (var cust : ctx.getTopCustomersByOutstanding()) {
                    sb.append(String.format("%d. %s — Outstanding: ₹%s (Credit limit: ₹%s)\n",
                            idx++, cust.getName(), cust.getOutstandingAmount(), cust.getCreditLimit()));
                }
                sb.append(String.format("\nTotal Receivables: ₹%s\n", ctx.getTotalReceivables() != null ? ctx.getTotalReceivables() : BigDecimal.ZERO));
                sb.append("Recommendation: Enforce credit limits and prioritize collections for high-exposure accounts.");
                return sb.toString();
            } else {
                return "Customer accounts are currently clear with zero overdue receivables.";
            }
        }

        if (lower.contains("sold") || lower.contains("sales") || lower.contains("revenue")) {
            if (ctx != null && ctx.getRecentSales() != null && !ctx.getRecentSales().isEmpty()) {
                BigDecimal totalRev = ctx.getRecentSales().stream().map(s -> s.getTotalAmount()).reduce(BigDecimal.ZERO, BigDecimal::add);
                StringBuilder sb = new StringBuilder(String.format("Recent Sales Activity (Live Data):\nTotal Recent Sales: ₹%s across %d transactions\n\nLatest transactions:\n",
                        totalRev, ctx.getRecentSales().size()));
                int idx = 1;
                for (var sale : ctx.getRecentSales().stream().limit(5).toList()) {
                    String cust = sale.getCustomer() != null ? sale.getCustomer().getName() : "Direct Customer";
                    sb.append(String.format("%d. %s — %s: ₹%s (%s)\n", idx++, sale.getSaleNumber(), cust, sale.getTotalAmount(), sale.getSaleDate()));
                }
                return sb.toString();
            } else {
                return "No sales transactions recorded yet for the current period.";
            }
        }

        if (lower.contains("health") || lower.contains("business")) {
            if (ctx != null && ctx.getBusinessHealthScore() != null) {
                var h = ctx.getBusinessHealthScore();
                if (h.getOverallScore() == null) {
                    return "Business Health Score: Baseline Pending.\n" + h.getStatusMessage();
                }
                return String.format("ThreadPilot Business Health Assessment:\nOverall Health Score: %d/100\n\n" +
                        "• Inventory Health: %d/100\n" +
                        "• Sales Health: %d/100\n" +
                        "• Collections Health: %d/100\n" +
                        "• Profitability Health: %d/100\n" +
                        "• Slow-Moving Health: %d/100\n\nStatus: %s",
                        h.getOverallScore(),
                        h.getInventoryHealth() != null ? h.getInventoryHealth() : 0,
                        h.getSalesHealth() != null ? h.getSalesHealth() : 0,
                        h.getCollectionsHealth() != null ? h.getCollectionsHealth() : 0,
                        h.getProfitabilityHealth() != null ? h.getProfitabilityHealth() : 0,
                        h.getSlowMovingHealth() != null ? h.getSlowMovingHealth() : 0,
                        h.getStatusMessage());
            }
        }

        return "I am ThreadPilot AI, your grounded AI Business Brain for hosiery and textile manufacturing.\n" +
                "I analyze live ERP records to provide:\n" +
                "• Inventory health & depletion warnings\n" +
                "• Customer receivables aging & credit breach tracking\n" +
                "• High-sales vs poor-collection debtor analysis\n" +
                "• Inactive customer purchasing cycle indicators\n\n" +
                "How can I assist your operations today?";
    }
}
