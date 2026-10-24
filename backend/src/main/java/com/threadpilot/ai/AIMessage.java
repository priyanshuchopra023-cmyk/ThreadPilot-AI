package com.threadpilot.ai;

public record AIMessage(
        String role,
        String content,
        String toolCallId,
        String name
) {}

