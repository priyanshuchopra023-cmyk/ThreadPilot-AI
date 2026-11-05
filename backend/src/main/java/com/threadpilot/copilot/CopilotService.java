package com.threadpilot.copilot;

import com.threadpilot.ai.AIProvider;
import com.threadpilot.ai.AIProviderFactory;
import com.threadpilot.ai.AIToolResult;
import com.threadpilot.ai.BusinessContextService;
import com.threadpilot.analytics.AnalyticsService;
import com.threadpilot.common.exception.BusinessException;
import com.threadpilot.security.TenantContext;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CopilotService {

    private final AIProviderFactory aiProviderFactory;
    private final BusinessContextService businessContextService;
    private final AnalyticsService analyticsService;
    private final AIConversationRepository conversationRepository;
    private final AIMessageRepository messageRepository;
    private final ObjectMapper objectMapper;

    @Transactional
    public CopilotResponse chat(UUID conversationId, String userMessage) {
        UUID orgId = TenantContext.requireTenantId();
        UUID userId = TenantContext.getUserId();

        AIConversation conversation;
        if (conversationId != null) {
            conversation = conversationRepository.findById(conversationId)
                    .filter(c -> c.getOrganization().getId().equals(orgId))
                    .orElseThrow(() -> new BusinessException("RESOURCE_NOT_FOUND", "Conversation not found"));
        } else {
            conversation = createNewConversation(userId, userMessage);
        }

        // Save user message
        saveMessage(conversation, "user", userMessage, null, null, null, null, null);

        // Get business context
        BusinessContextService.BusinessContext context = businessContextService.getBusinessContext();

        // Determine which tools to use based on user message
        List<ToolCall> toolCalls = determineToolCalls(userMessage);
        List<ToolResult> toolResults = new ArrayList<>();

        // Execute tools
        for (ToolCall toolCall : toolCalls) {
            ToolResult result = executeTool(toolCall, context);
            toolResults.add(result);
        }

        // Build messages for AI
        List<com.threadpilot.ai.AIMessage> messages = buildMessages(conversation, userMessage, toolCalls, toolResults);

        // Call AI provider
        AIProvider provider = aiProviderFactory.getDefaultProvider();
        com.threadpilot.ai.AIChatRequest request = new com.threadpilot.ai.AIChatRequest(
                buildAIMessages(conversation, userMessage, toolCalls, toolResults),
                provider.getDefaultModel(),
                0.3,
                2000,
                getAvailableTools(),
                "auto"
        );

        com.threadpilot.ai.AIChatResponse aiResponse = provider.chat(request);

        String assistantMessage = aiResponse.choices().get(0).message().content();

        // Save assistant message
        saveMessage(conversation, "assistant", assistantMessage,
                toolCalls.isEmpty() ? null : toJson(toolCalls),
                toolResults.isEmpty() ? null : toJson(toolResults),
                provider.getName(),
                provider.getDefaultModel(),
                aiResponse.usage().totalTokens()
        );

        // Update conversation
        conversation.setLastMessageAt(Instant.now());
        conversation.setTotalTokensUsed(conversation.getTotalTokensUsed() + aiResponse.usage().totalTokens());
        conversationRepository.save(conversation);

        return CopilotResponse.builder()
                .conversationId(conversation.getId())
                .message(assistantMessage)
                .toolCalls(toolCalls)
                .toolResults(toolResults)
                .tokensUsed(aiResponse.usage().totalTokens())
                .modelUsed(provider.getDefaultModel())
                .provider(provider.getName())
                .build();
    }

    private AIConversation createNewConversation(UUID userId, String firstMessage) {
        UUID orgId = TenantContext.requireTenantId();
        String title = firstMessage.length() > 50 ? firstMessage.substring(0, 50) + "..." : firstMessage;

        AIConversation conversation = AIConversation.builder()
                .title(title)
                .status(ConversationStatus.ACTIVE)
                .totalTokensUsed(0)
                .totalCost(java.math.BigDecimal.ZERO)
                .organization(new com.threadpilot.organization.Organization() {{ setId(orgId); }})
                .user(new com.threadpilot.user.User() {{ setId(userId); }})
                .lastMessageAt(Instant.now())
                .build();
        return conversationRepository.save(conversation);
    }

private void saveMessage(AIConversation conversation, String role, String content,
                             String toolCalls, String toolResults, String provider, String model, Integer tokensUsed) {
        AIMessage message = AIMessage.builder()
                .role(MessageRole.valueOf(role.toUpperCase()))
                .content(content)
                .toolCalls(toolCalls)
                .toolResults(toolResults)
                .provider(provider)
                .modelUsed(model)
                .tokensUsed(tokensUsed != null ? tokensUsed : 0)
                .cost(java.math.BigDecimal.ZERO)
                .conversation(conversation)
                .organization(conversation.getOrganization())
                .build();
        messageRepository.save(message);
    }

    private List<ToolCall> determineToolCalls(String userMessage) {
        List<ToolCall> calls = new ArrayList<>();
        String lower = userMessage.toLowerCase();

        if (lower.contains("low stock") || lower.contains("running low") || lower.contains("stock level")) {
            calls.add(new ToolCall("getLowStockProducts", Map.of()));
        }
        if (lower.contains("out of stock") || lower.contains("stock out")) {
            calls.add(new ToolCall("getOutOfStockProducts", Map.of()));
        }
        if (lower.contains("owe") || lower.contains("outstanding") || lower.contains("overdue") || lower.contains("receivable")) {
            calls.add(new ToolCall("getCustomerOutstanding", Map.of()));
        }
        if (lower.contains("supplier") && (lower.contains("owe") || lower.contains("payable") || lower.contains("outstanding"))) {
            calls.add(new ToolCall("getSupplierOutstanding", Map.of()));
        }
        if (lower.contains("sales") || lower.contains("revenue") || lower.contains("sold")) {
            calls.add(new ToolCall("getSalesSummary", Map.of("days", 30)));
        }
        if (lower.contains("product") && (lower.contains("selling") || lower.contains("top"))) {
            calls.add(new ToolCall("getTopSellingProducts", Map.of("days", 30)));
        }
        if (lower.contains("slow") || lower.contains("not moving") || lower.contains("dead stock")) {
            calls.add(new ToolCall("getSlowMovingProducts", Map.of()));
        }
        if (lower.contains("health") || lower.contains("business health") || lower.contains("score")) {
            calls.add(new ToolCall("getBusinessHealth", Map.of()));
        }
        if (lower.contains("inventory value") || lower.contains("stock value")) {
            calls.add(new ToolCall("getInventoryValue", Map.of()));
        }
        if (lower.contains("cash flow") || lower.contains("cash position")) {
            calls.add(new ToolCall("getCashFlow", Map.of()));
        }
        if (lower.contains("aging") || lower.contains("due date") || lower.contains("receivables aging")) {
            calls.add(new ToolCall("getReceivablesAging", Map.of()));
        }
        if (lower.contains("credit") || lower.contains("breach") || lower.contains("intelligence") || lower.contains("segment") || lower.contains("reactivat")) {
            calls.add(new ToolCall("getCustomerCreditIntelligence", Map.of()));
        }
        if (lower.contains("action") || lower.contains("task") || lower.contains("priority") || lower.contains("today") || lower.contains("to-do")) {
            calls.add(new ToolCall("getDailyActionCenter", Map.of()));
        }
        if (lower.contains("textile") || lower.contains("hosiery") || lower.contains("yarn") || lower.contains("velocity") || lower.contains("trend") || lower.contains("deadstock")) {
            calls.add(new ToolCall("getTextileProductIntelligence", Map.of()));
        }
        if (lower.contains("draft") || lower.contains("reminder") || lower.contains("follow up") || lower.contains("whatsapp") || lower.contains("email payment")) {
            calls.add(new ToolCall("draftFollowupMessage", Map.of()));
        }

        return calls;
    }

    private ToolResult executeTool(ToolCall toolCall, BusinessContextService.BusinessContext context) {
        return switch (toolCall.getName()) {
            case "getLowStockProducts" -> new ToolResult(toolCall.getName(), true,
                    context.getLowStockProducts().stream()
                            .map(i -> Map.of(
                                    "product", i.getProduct() != null ? i.getProduct().getName() : "Variant",
                                    "sku", i.getProduct() != null ? i.getProduct().getSku() : i.getVariant().getSku(),
                                    "available", i.getAvailableQuantity(),
                                    "minLevel", i.getProduct() != null ? i.getProduct().getMinStockLevel() : i.getVariant().getMinStockLevel()
                             ))
                            .toList(), null);
            case "getOutOfStockProducts" -> new ToolResult(toolCall.getName(), true,
                    context.getOutOfStockProducts().stream()
                            .map(i -> Map.of(
                                    "product", i.getProduct() != null ? i.getProduct().getName() : "Variant",
                                    "sku", i.getProduct() != null ? i.getProduct().getSku() : i.getVariant().getSku()
                            ))
                            .toList(), null);
            case "getCustomerOutstanding" -> new ToolResult(toolCall.getName(), true,
                    context.getTopCustomersByOutstanding().stream()
                            .map(c -> Map.of(
                                    "customer", c.getName(),
                                    "outstanding", c.getOutstandingAmount(),
                                    "creditLimit", c.getCreditLimit()
                            ))
                            .toList(), null);
            case "getSupplierOutstanding" -> new ToolResult(toolCall.getName(), true,
                    context.getTopSuppliersByOutstanding().stream()
                            .map(s -> Map.of(
                                    "supplier", s.getName(),
                                    "outstanding", s.getOutstandingAmount()
                            ))
                            .toList(), null);
            case "getSalesSummary" -> {
                int days = (int) toolCall.getParameters().getOrDefault("days", 30);
                LocalDate start = LocalDate.now().minusDays(days);
                BigDecimal revenue = context.getRecentSales().stream()
                        .filter(s -> s.getSaleDate().isAfter(start) || s.getSaleDate().isEqual(start))
                        .map(com.threadpilot.sale.Sale::getTotalAmount)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
                yield new ToolResult(toolCall.getName(), true,
                        Map.of("periodDays", days, "totalRevenue", revenue, "orderCount", context.getRecentSales().size()), null);
            }
            case "getTopSellingProducts" -> new ToolResult(toolCall.getName(), true,
                    context.getRecentSales().stream()
                            .flatMap(s -> s.getItems().stream())
                            .collect(Collectors.groupingBy(
                                    i -> i.getProduct() != null ? i.getProduct().getName() : i.getVariant().getSku(),
                                    Collectors.summingInt(com.threadpilot.sale.SaleItem::getQuantity)
                            ))
                            .entrySet().stream()
                            .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
                            .limit(10)
                            .map(e -> Map.of("product", e.getKey(), "quantity", e.getValue()))
                            .toList(), null);
            case "getSlowMovingProducts" -> new ToolResult(toolCall.getName(), true,
                    context.getSlowMovingProducts().stream()
                            .map(i -> Map.of(
                                    "product", i.getProduct() != null ? i.getProduct().getName() : "Variant",
                                    "sku", i.getProduct() != null ? i.getProduct().getSku() : i.getVariant().getSku(),
                                    "stock", i.getCurrentQuantity()
                            ))
                            .toList(), null);
            case "getBusinessHealth" -> {
                var h = context.getBusinessHealthScore();
                Map<String, Object> map = new java.util.HashMap<>();
                map.put("overall", h.getOverallScore() != null ? h.getOverallScore() : "Not enough data");
                map.put("inventory", h.getInventoryHealth() != null ? h.getInventoryHealth() : "Not enough data");
                map.put("sales", h.getSalesHealth() != null ? h.getSalesHealth() : "Not enough data");
                map.put("collections", h.getCollectionsHealth() != null ? h.getCollectionsHealth() : "Not enough data");
                map.put("profitability", h.getProfitabilityHealth() != null ? h.getProfitabilityHealth() : "Not enough data");
                map.put("slowMoving", h.getSlowMovingHealth() != null ? h.getSlowMovingHealth() : "Not enough data");
                map.put("hasSufficientData", h.getHasSufficientData() != null ? h.getHasSufficientData() : false);
                yield new ToolResult(toolCall.getName(), true, map, null);
            }
            case "getInventoryValue" -> new ToolResult(toolCall.getName(), true,
                    Map.of("totalValue", context.getTotalInventoryValue()), null);
            case "getCashFlow" -> new ToolResult(toolCall.getName(), true,
                    Map.of(
                            "receivables", context.getTotalReceivables(),
                            "payables", context.getTotalPayables(),
                            "netPosition", context.getTotalReceivables().subtract(context.getTotalPayables())
                    ), null);
            case "getReceivablesAging" -> new ToolResult(toolCall.getName(), true,
                    analyticsService.getReceivablesAging(), null);
            case "getCustomerCreditIntelligence" -> new ToolResult(toolCall.getName(), true,
                    analyticsService.getCustomerCreditIntelligence(), null);
            case "getDailyActionCenter" -> new ToolResult(toolCall.getName(), true,
                    analyticsService.getDailyActionCenter(), null);
            case "getTextileProductIntelligence" -> new ToolResult(toolCall.getName(), true,
                    analyticsService.getTextileProductIntelligence(), null);
            case "draftFollowupMessage" -> {
                List<AnalyticsService.CustomerIntelligence> intel = analyticsService.getCustomerCreditIntelligence();
                var candidate = intel.stream()
                        .filter(c -> "CREDIT_LIMIT_BREACHED".equals(c.getSegment()) || "HIGH_SALES_POOR_COLLECTION".equals(c.getSegment()) || c.getOutstandingBalance().compareTo(BigDecimal.ZERO) > 0)
                        .findFirst()
                        .orElse(null);

                String custName = candidate != null ? candidate.getCustomerName() : "Valued Customer";
                BigDecimal bal = candidate != null ? candidate.getOutstandingBalance() : BigDecimal.ZERO;

                Map<String, Object> draftResult = Map.of(
                        "channel", "WhatsApp/Email",
                        "customerName", custName,
                        "outstandingBalance", bal,
                        "requiresHumanApproval", true,
                        "disclaimer", "Non-consequential draft only. Human review and manual dispatch required. No automated message has been sent.",
                        "suggestedDraftText", "Dear " + custName + ", this is a gentle payment reminder from ThreadPilot regarding your pending balance of ₹" + bal + ". Please let us know when we can expect settlement or reply with your payment reference. Thank you!"
                );
                yield new ToolResult(toolCall.getName(), true, draftResult, null);
            }
            default -> new ToolResult(toolCall.getName(), false, null, "Unknown tool: " + toolCall.getName());
        };
    }

    private List<com.threadpilot.ai.AIMessage> buildMessages(AIConversation conversation, String userMessage,
                                                              List<ToolCall> toolCalls, List<ToolResult> toolResults) {
        List<com.threadpilot.ai.AIMessage> messages = new ArrayList<>();

        // System prompt
        messages.add(new com.threadpilot.ai.AIMessage("system",
                "You are ThreadPilot Copilot, an AI business assistant for hosiery wholesalers and retailers. " +
                        "You have access to real-time business data through tools. " +
                        "Always use tools when users ask for specific business data. " +
                        "Provide clear, actionable insights based on the data. " +
                        "Distinguish between facts (from tools) and recommendations. " +
                        "Format responses professionally with clear sections.",
                null, null));

        // Add conversation history (last 10 messages)
        List<AIMessage> history = messageRepository.findByConversationIdOrderByCreatedAt(conversation.getId());
        for (AIMessage msg : history.stream().skip(Math.max(0, history.size() - 10)).toList()) {
            messages.add(new com.threadpilot.ai.AIMessage(
                    msg.getRole().name().toLowerCase(),
                    msg.getContent(),
                    null,
                    null
            ));
        }

        // Add current user message
        messages.add(new com.threadpilot.ai.AIMessage("user", userMessage, null, null));

        // Add tool results if any
        for (int i = 0; i < toolCalls.size(); i++) {
            ToolCall call = toolCalls.get(i);
            ToolResult result = toolResults.get(i);
            if (result.isSuccess()) {
                messages.add(new com.threadpilot.ai.AIMessage("tool", result.getData().toString(), call.getId(), call.getName()));
            }
        }

        return messages;
    }

    private List<com.threadpilot.ai.AIMessage> buildAIMessages(AIConversation conversation, String userMessage,
                                                                List<ToolCall> toolCalls, List<ToolResult> toolResults) {
        List<com.threadpilot.ai.AIMessage> messages = new ArrayList<>();

        // System prompt
        messages.add(new com.threadpilot.ai.AIMessage("system",
                "You are ThreadPilot Copilot, an AI business assistant for hosiery wholesalers and retailers. " +
                        "You have access to real-time business data through tools. " +
                        "Always use tools when users ask for specific business data. " +
                        "Provide clear, actionable insights based on the data. " +
                        "Distinguish between facts (from tools) and recommendations. " +
                        "Format responses professionally with clear sections.",
                null, null));

        // Add conversation history (last 10 messages)
        List<AIMessage> history = messageRepository.findByConversationIdOrderByCreatedAt(conversation.getId());
        for (AIMessage msg : history.stream().skip(Math.max(0, history.size() - 10)).toList()) {
            messages.add(new com.threadpilot.ai.AIMessage(
                    msg.getRole().name().toLowerCase(),
                    msg.getContent(),
                    null,
                    null
            ));
        }

        // Add current user message
        messages.add(new com.threadpilot.ai.AIMessage("user", userMessage, null, null));

        // Add tool results if any
        for (int i = 0; i < toolCalls.size(); i++) {
            ToolCall call = toolCalls.get(i);
            ToolResult result = toolResults.get(i);
            if (result.isSuccess()) {
                messages.add(new com.threadpilot.ai.AIMessage("tool", result.getData().toString(), call.getId(), call.getName()));
            }
        }

        return messages;
    }

    private List<com.threadpilot.ai.AITool> getAvailableTools() {
        return List.of(
                new com.threadpilot.ai.AITool("function", new com.threadpilot.ai.Function(
                        "getLowStockProducts",
                        "Get products with stock below minimum level",
                        Map.of("type", "object", "properties", Map.of())
                )),
                new com.threadpilot.ai.AITool("function", new com.threadpilot.ai.Function(
                        "getOutOfStockProducts",
                        "Get products with zero available stock",
                        Map.of("type", "object", "properties", Map.of())
                )),
                new com.threadpilot.ai.AITool("function", new com.threadpilot.ai.Function(
                        "getCustomerOutstanding",
                        "Get customers with outstanding balances",
                        Map.of("type", "object", "properties", Map.of())
                )),
                new com.threadpilot.ai.AITool("function", new com.threadpilot.ai.Function(
                        "getSupplierOutstanding",
                        "Get suppliers with outstanding balances",
                        Map.of("type", "object", "properties", Map.of())
                )),
                new com.threadpilot.ai.AITool("function", new com.threadpilot.ai.Function(
                        "getSalesSummary",
                        "Get sales summary for a period",
                        Map.of("type", "object", "properties", Map.of("days", Map.of("type", "integer", "default", 30)))
                )),
                new com.threadpilot.ai.AITool("function", new com.threadpilot.ai.Function(
                        "getTopSellingProducts",
                        "Get top selling products by quantity",
                        Map.of("type", "object", "properties", Map.of("days", Map.of("type", "integer", "default", 30)))
                )),
                new com.threadpilot.ai.AITool("function", new com.threadpilot.ai.Function(
                        "getSlowMovingProducts",
                        "Get slow-moving inventory items",
                        Map.of("type", "object", "properties", Map.of())
                )),
                new com.threadpilot.ai.AITool("function", new com.threadpilot.ai.Function(
                        "getBusinessHealth",
                        "Get business health score breakdown",
                        Map.of("type", "object", "properties", Map.of())
                )),
                new com.threadpilot.ai.AITool("function", new com.threadpilot.ai.Function(
                        "getInventoryValue",
                        "Get total inventory value",
                        Map.of("type", "object", "properties", Map.of())
                )),
                new com.threadpilot.ai.AITool("function", new com.threadpilot.ai.Function(
                        "getCashFlow",
                        "Get cash flow position (receivables vs payables)",
                        Map.of("type", "object", "properties", Map.of())
                )),
                new com.threadpilot.ai.AITool("function", new com.threadpilot.ai.Function(
                        "getReceivablesAging",
                        "Get receivables aging buckets (0-30, 31-60, 61-90, 90+) based on invoice due dates",
                        Map.of("type", "object", "properties", Map.of())
                )),
                new com.threadpilot.ai.AITool("function", new com.threadpilot.ai.Function(
                        "getCustomerCreditIntelligence",
                        "Get customer credit intelligence, delinquency risk, and purchasing cycle segments",
                        Map.of("type", "object", "properties", Map.of())
                )),
                new com.threadpilot.ai.AITool("function", new com.threadpilot.ai.Function(
                        "getDailyActionCenter",
                        "Get prioritized daily actions with financial impact in INR and source links",
                        Map.of("type", "object", "properties", Map.of())
                )),
                new com.threadpilot.ai.AITool("function", new com.threadpilot.ai.Function(
                        "getTextileProductIntelligence",
                        "Get textile & hosiery 30-day velocity, days of stock, and demand trends",
                        Map.of("type", "object", "properties", Map.of())
                )),
                new com.threadpilot.ai.AITool("function", new com.threadpilot.ai.Function(
                        "draftFollowupMessage",
                        "Draft follow-up reminder messages for overdue customers requiring human approval",
                        Map.of("type", "object", "properties", Map.of())
                ))
        );
    }

    private String toJson(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            log.warn("Failed to serialize to JSON", e);
            return "{}";
        }
    }

    @lombok.Builder
    @lombok.Data
    public static class CopilotResponse {
        private UUID conversationId;
        private String message;
        private List<ToolCall> toolCalls;
        private List<ToolResult> toolResults;
        private Integer tokensUsed;
        private String modelUsed;
        private String provider;
        private List<String> toolsUsed;

        public List<String> getToolsUsed() {
            if (toolsUsed != null) return toolsUsed;
            if (toolCalls == null) return List.of();
            return toolCalls.stream().map(ToolCall::getName).toList();
        }
    }

    @lombok.Builder
    @lombok.Data
    public static class ToolCall {
        private final String id = java.util.UUID.randomUUID().toString();
        private String name;
        private Map<String, Object> parameters;

        public String getId() { return id; }
        public String getName() { return name; }
        public Map<String, Object> getParameters() { return parameters; }
    }

    @lombok.Builder
    @lombok.Data
    public static class ToolResult {
        private String toolName;
        private boolean success;
        private Object data;
        private String error;

        public boolean isSuccess() { return success; }
        public Object getData() { return data; }
    }
}