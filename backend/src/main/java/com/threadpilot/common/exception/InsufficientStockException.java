package com.threadpilot.common.exception;

public class InsufficientStockException extends BusinessException {

    public InsufficientStockException(String productName, int available, int requested) {
        super("INSUFFICIENT_STOCK",
                String.format("Insufficient stock for %s: available=%d, requested=%d", productName, available, requested),
                productName, available, requested);
    }

    public InsufficientStockException(String message) {
        super("INSUFFICIENT_STOCK", message);
    }
}

