package com.threadpilot.ai;

public record AIRecommendationResponse(
        String recommendation,
        String explanation,
        Double confidence,
        String supportingData
) {}

