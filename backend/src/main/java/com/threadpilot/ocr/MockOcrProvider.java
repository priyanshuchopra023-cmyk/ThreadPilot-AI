package com.threadpilot.ocr;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@Component
@Slf4j
public class MockOcrProvider implements OcrProvider {

    @Override
    public String getName() {
        return "mock";
    }

    @Override
    public OcrResult process(MultipartFile file) {
        log.info("Mock OCR processing file: {}", file.getOriginalFilename());
        return generateMockResult(file.getOriginalFilename());
    }

    @Override
    public OcrResult process(byte[] fileData, String mimeType) {
        log.info("Mock OCR processing byte array, mime: {}", mimeType);
        return generateMockResult("mock-file." + getExtension(mimeType));
    }

    @Override
    public boolean isAvailable() {
        return true;
    }

    @Override
    public void validateConfiguration() {
        // No configuration needed
    }

    private OcrResult generateMockResult(String filename) {
        // Return mock extracted data that looks like a supplier invoice
        return OcrResult.builder()
                .success(true)
                .rawText("SUPPLIER INVOICE\nABC Textiles Ltd\nGST: 27ABCDE1234F1Z5\nInvoice No: INV-2024-001\nDate: 15/01/2024\n\nItems:\n1. Cotton Socks Black M - 100 pcs @ ₹45.00 = ₹4,500.00\n2. Wool Socks Grey L - 50 pcs @ ₹120.00 = ₹6,000.00\n3. Athletic Socks White M - 200 pcs @ ₹35.00 = ₹7,000.00\n\nSubtotal: ₹17,500.00\nGST (18%): ₹3,150.00\nTotal: ₹20,650.00")
                .confidence(0.92)
                .structuredData(Map.of(
                        "supplierName", "ABC Textiles Ltd",
                        "supplierGst", "27ABCDE1234F1Z5",
                        "invoiceNumber", "INV-2024-001",
                        "invoiceDate", "2024-01-15",
                        "dueDate", "2024-02-14",
                        "subtotal", 17500.00,
                        "taxAmount", 3150.00,
                        "totalAmount", 20650.00
                ))
                .lineItems(List.of(
                        OcrResult.OcrLineItem.builder()
                                .description("Cotton Socks Black M")
                                .quantity(100)
                                .unitPrice(45.00)
                                .taxRate(18.0)
                                .discountRate(0.0)
                                .lineTotal(5310.00)
                                .build(),
                        OcrResult.OcrLineItem.builder()
                                .description("Wool Socks Grey L")
                                .quantity(50)
                                .unitPrice(120.00)
                                .taxRate(18.0)
                                .discountRate(0.0)
                                .lineTotal(7080.00)
                                .build(),
                        OcrResult.OcrLineItem.builder()
                                .description("Athletic Socks White M")
                                .quantity(200)
                                .unitPrice(35.00)
                                .taxRate(18.0)
                                .discountRate(0.0)
                                .lineTotal(8260.00)
                                .build()
                ))
                .build();
    }

    private String getExtension(String mimeType) {
        return switch (mimeType) {
            case "application/pdf" -> "pdf";
            case "image/jpeg" -> "jpg";
            case "image/png" -> "png";
            default -> "bin";
        };
    }
}

