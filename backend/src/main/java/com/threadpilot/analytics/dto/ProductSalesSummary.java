package com.threadpilot.analytics.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductSalesSummary {

    private UUID productId;
    private String productName;
    private String productSku;
    private Long totalQuantity;
    private BigDecimal totalRevenue;
    private BigDecimal totalCost;
    private BigDecimal grossProfit;

    public BigDecimal getGrossMarginPercent() {
        if (totalRevenue == null || totalRevenue.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        return grossProfit.divide(totalRevenue, 4, java.math.RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100));
    }
}

