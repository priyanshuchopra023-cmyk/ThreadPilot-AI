package com.threadpilot.common.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaginationRequest {

    @Min(0)
    @Builder.Default
    private int page = 0;

    @Min(1)
    @Max(100)
    @Builder.Default
    private int size = 20;

    private String sortBy;
    private String sortDir;

    // Invoice-specific filters
    private String status;
    private String ocrStatus;
    private String supplierId;

    public org.springframework.data.domain.Pageable toPageable() {
        org.springframework.data.domain.Sort.Direction direction = "desc".equalsIgnoreCase(sortDir)
                ? org.springframework.data.domain.Sort.Direction.DESC
                : org.springframework.data.domain.Sort.Direction.ASC;
        org.springframework.data.domain.Sort sort = org.springframework.data.domain.Sort.by(direction, sortBy != null ? sortBy : "createdAt");
        int pageIndex = page > 0 ? page - 1 : 0;
        return org.springframework.data.domain.PageRequest.of(pageIndex, size, sort);
    }
}

