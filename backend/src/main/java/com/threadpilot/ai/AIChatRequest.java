package com.threadpilot.ai;

import java.util.List;

public record AIChatRequest(
        List<AIMessage> messages,
        String model,
        Double temperature,
        Integer maxTokens,
        List<AITool> tools,
        String toolChoice
) {}

