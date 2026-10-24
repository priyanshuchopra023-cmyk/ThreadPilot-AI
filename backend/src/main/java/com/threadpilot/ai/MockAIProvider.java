package com.threadpilot.ai;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@Slf4j
public class MockAIProvider implements AIProvider {

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

        String response = generateMockResponse(lastMessage);

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
                "Mock recommendation for " + request.recommendationType(),
                "This is a mock recommendation generated for testing purposes.",
                0.85,
                "Mock supporting data"
        );
    }

    @Override
    public AIAnalysisResponse analyzeBusinessContext(AIAnalysisRequest request) {
        return new AIAnalysisResponse(
                "Mock analysis for: " + request.question(),
                List.of("Mock data source"),
                0.8
        );
    }

    @Override
    public boolean isAvailable() {
        return true;
    }

    @Override
    public void validateConfiguration() {
        // No configuration needed for mock
    }

    private String generateMockResponse(String userMessage) {
        String lower = userMessage.toLowerCase();

        if (lower.contains("low stock") || lower.contains("running low")) {
            return "Based on current inventory data, the following products are running low:\n" +
                    "1. Cotton Socks Black/M - 5 units (reorder level: 20)\n" +
                    "2. Wool Socks Grey/L - 8 units (reorder level: 15)\n" +
                    "3. Athletic Socks White/M - 3 units (reorder level: 25)\n\n" +
                    "Recommendation: Place reorder with primary supplier for these items.";
        }

        if (lower.contains("owe") || lower.contains("outstanding") || lower.contains("overdue")) {
            return "Customer outstanding analysis:\n" +
                    "1. ABC Retailers - ₹1,25,000 (45 days overdue)\n" +
                    "2. XYZ Wholesale - ₹89,000 (30 days overdue)\n" +
                    "3. Fashion Hub - ₹67,500 (15 days overdue)\n\n" +
                    "Total outstanding: ₹2,81,500\n" +
                    "Recommendation: Prioritize follow-up with ABC Retailers and XYZ Wholesale.";
        }

        if (lower.contains("sold") || lower.contains("sales") || lower.contains("revenue")) {
            return "Sales summary for this month:\n" +
                    "Total Revenue: ₹12,50,000\n" +
                    "Total Orders: 342\n" +
                    "Average Order Value: ₹3,655\n\n" +
                    "Top selling products:\n" +
                    "1. Cotton Socks (Assorted) - ₹3,20,000\n" +
                    "2. Wool Socks Winter Collection - ₹2,80,000\n" +
                    "3. Athletic Performance Socks - ₹1,95,000";
        }

        if (lower.contains("slow") || lower.contains("not moving")) {
            return "Slow-moving inventory analysis:\n" +
                    "1. Silk Socks Premium - 150 units, 120 days in stock\n" +
                    "2. Designer Pattern Socks - 89 units, 95 days in stock\n" +
                    "3. Bamboo Fiber Socks - 67 units, 110 days in stock\n\n" +
                    "Recommendation: Consider promotional pricing or bundle deals to clear slow-moving stock.";
        }

        if (lower.contains("reorder") || lower.contains("purchase")) {
            return "Reorder recommendations:\n" +
                    "1. Cotton Socks Black/M - Reorder 200 units from Supplier A (best price)\n" +
                    "2. Wool Socks Grey/L - Reorder 150 units from Supplier B\n" +
                    "3. Athletic Socks White/M - Reorder 300 units from Supplier A\n\n" +
                    "Estimated total purchase: ₹2,45,000";
        }

        if (lower.contains("health") || lower.contains("business")) {
            return "Business Health Score: 78/100\n\n" +
                    "Inventory Health: 82/100\n" +
                    "Sales Health: 74/100\n" +
                    "Collections Health: 68/100\n" +
                    "Profitability: 85/100\n" +
                    "Slow-Moving: 72/100\n\n" +
                    "Key areas for improvement:\n" +
                    "1. Collections - Several large accounts overdue\n" +
                    "2. Sales - Down 12% from previous month\n" +
                    "3. Slow-moving inventory tying up capital";
        }

        return "I'm ThreadPilot Copilot, your AI business assistant. I can help you with:\n" +
                "- Inventory levels and low stock alerts\n" +
                "- Customer outstanding and overdue payments\n" +
                "- Sales analysis and trends\n" +
                "- Slow-moving inventory identification\n" +
                "- Reorder recommendations\n" +
                "- Business health assessment\n\n" +
                "What would you like to know about your business?";
    }
}

