package com.threadpilot.common.exception;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import java.util.Set;

public class ValidationException extends BusinessException {

    private final Set<ConstraintViolation<?>> violations;

    public ValidationException(String message, Set<ConstraintViolation<?>> violations) {
        super("VALIDATION_ERROR", message);
        this.violations = violations;
    }

    public ValidationException(ConstraintViolationException ex) {
        super("VALIDATION_ERROR", "Validation failed");
        this.violations = ex.getConstraintViolations();
    }

    public Set<ConstraintViolation<?>> getViolations() {
        return violations;
    }
}

