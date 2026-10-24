package com.threadpilot.ai;

public record AIUsage(
        int promptTokens,
        int completionTokens,
        int totalTokens
) {}

