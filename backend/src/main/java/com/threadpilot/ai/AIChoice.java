package com.threadpilot.ai;

public record AIChoice(
        int index,
        AIMessage message,
        String finishReason
) {}

