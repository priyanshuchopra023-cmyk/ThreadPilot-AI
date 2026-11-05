package com.threadpilot.ocr;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.*;

import java.util.List;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class OcrResult {

    private boolean success;
    private String rawText;
    private Double confidence;
    private Map<String, Object> structuredData;
    private List<OcrLineItem> lineItems;
    private String error;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class OcrLineItem {
        private String description;
        private Integer quantity;
        private Double unitPrice;
        private Double taxRate;
        private Double discountRate;
        private Double lineTotal;
    }
}
