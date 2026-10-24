package com.threadpilot.ai;

import java.util.List;

public record AIAnalysisRequest(
        String context,
        String question,
        String model,
        Double temperature
) {}

