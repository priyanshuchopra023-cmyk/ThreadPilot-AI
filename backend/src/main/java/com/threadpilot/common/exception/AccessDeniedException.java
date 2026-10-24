package com.threadpilot.common.exception;

public class AccessDeniedException extends BusinessException {

    public AccessDeniedException(String message) {
        super("ACCESS_DENIED", message);
    }

    public AccessDeniedException() {
        super("ACCESS_DENIED", "Access denied: insufficient permissions");
    }
}

