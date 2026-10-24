package com.threadpilot.analytics.dto;

import com.threadpilot.expense.ExpenseCategory;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExpenseSummary {

    private ExpenseCategory category;
    private BigDecimal totalAmount;
    private Long count;
}

