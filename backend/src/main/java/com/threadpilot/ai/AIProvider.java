package com.threadpilot.ai;

import java.util.List;
import java.util.Map;

public interface AIProvider {

    String getName();

    String getDefaultModel();

    AIChatResponse chat(AIChatRequest request);

    AIRecommendationResponse generateRecommendation(AIRecommendationRequest request);

    AIAnalysisResponse analyzeBusinessContext(AIAnalysisRequest request);

    boolean isAvailable();

    void validateConfiguration();
}

