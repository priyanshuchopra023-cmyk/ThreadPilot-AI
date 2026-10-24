package com.threadpilot.ai;

import java.util.List;

public record AIChatResponse(
        String id,
        String model,
        List<AIChoice> choices,
        AIUsage usage
) {}

