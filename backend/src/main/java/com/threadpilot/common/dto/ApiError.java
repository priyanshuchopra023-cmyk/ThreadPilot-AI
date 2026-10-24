package com.threadpilot.common.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApiError {
    private String field;
    private String code;
    private String message;
    private Object rejectedValue;
}

