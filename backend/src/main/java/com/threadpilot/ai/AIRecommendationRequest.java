package com.threadpilot.ai;

public record AIRecommendationRequest(
        String context,
        String recommendationType,
        String model,
        Double temperature
) {}

