package com.threadpilot.common.exception;

public class ConflictException extends BusinessException {

    public ConflictException(String message) {
        super("CONFLICT", message);
    }

    public ConflictException(String resourceName, String field, Object value) {
        super("CONFLICT",
                String.format("%s already exists with %s: %s", resourceName, field, value),
                resourceName, field, value);
    }
}

