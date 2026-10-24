package com.threadpilot.ai;

import java.util.List;

public record AIAnalysisResponse(
        String analysis,
        List<String> dataSources,
        Double confidence
) {}

