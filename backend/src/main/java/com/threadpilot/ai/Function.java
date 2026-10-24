package com.threadpilot.ai;

import java.util.Map;

public record Function(
        String name,
        String description,
        Map<String, Object> parameters
) {}

