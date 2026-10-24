package com.threadpilot.analytics.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustomerSalesSummary {

    private UUID customerId;
    private String customerName;
    private BigDecimal totalRevenue;
    private Long orderCount;
}

