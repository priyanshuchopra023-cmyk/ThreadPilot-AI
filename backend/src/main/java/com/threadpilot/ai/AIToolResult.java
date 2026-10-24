package com.threadpilot.ai;

public record AIToolResult(
        String toolName,
        boolean success,
        Object data,
        String error
) {}

