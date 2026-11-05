package com.threadpilot.ocr;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.threadpilot.common.exception.BusinessException;
import com.threadpilot.invoice.OcrStatus;
import com.threadpilot.invoice.SupplierInvoice;
import com.threadpilot.invoice.SupplierInvoiceItemRepository;
import com.threadpilot.invoice.SupplierInvoiceRepository;
import com.threadpilot.invoice.SupplierInvoiceService;
import com.threadpilot.organization.Organization;
import com.threadpilot.product.ProductRepository;
import com.threadpilot.product.ProductVariantRepository;
import com.threadpilot.security.TenantContext;
import com.threadpilot.storage.StorageService;
import com.threadpilot.supplier.SupplierRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OcrServiceTest {

    @Mock
    private OcrProviderFactory ocrProviderFactory;
    @Mock
    private StorageService storageService;
    @Mock
    private SupplierInvoiceRepository invoiceRepository;
    @Mock
    private SupplierInvoiceItemRepository itemRepository;
    @Mock
    private SupplierInvoiceService invoiceService;
    @Mock
    private SupplierRepository supplierRepository;
    @Mock
    private ProductRepository productRepository;
    @Mock
    private ProductVariantRepository variantRepository;

    private ObjectMapper objectMapper;
    private OcrService ocrService;

    private final UUID orgId = UUID.fromString("d061d703-f8b2-4669-98ed-cbd65b9896a7");
    private final UUID invoiceId = UUID.fromString("f5298fa9-1ddd-436b-8637-3573fa2fe1cb");

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        ocrService = new OcrService(
                ocrProviderFactory,
                storageService,
                invoiceRepository,
                itemRepository,
                invoiceService,
                supplierRepository,
                productRepository,
                variantRepository,
                objectMapper
        );
        TenantContext.setOrganizationId(orgId);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void getOcrResult_successfullyParsesLegacyStructuredDataMap() {
        // Given exact stored JSON for document f5298fa9-1ddd-436b-8637-3573fa2fe1cb
        String legacyJson = "{\"dueDate\": \"2024-02-14\", \"subtotal\": 17500.0, \"taxAmount\": 3150.0, " +
                "\"invoiceDate\": \"2024-01-15\", \"supplierGst\": \"27ABCDE1234F1Z5\", \"totalAmount\": 20650.0, " +
                "\"supplierName\": \"ABC Textiles Ltd\", \"invoiceNumber\": \"INV-2024-001\"}";

        Organization org = new Organization();
        org.setId(orgId);

        SupplierInvoice invoice = SupplierInvoice.builder()
                .ocrStatus(OcrStatus.COMPLETED)
                .ocrConfidence(0.92)
                .ocrRawData(legacyJson)
                .organization(org)
                .build();
        invoice.setId(invoiceId);

        when(invoiceRepository.findById(invoiceId)).thenReturn(Optional.of(invoice));

        // When
        OcrResult result = ocrService.getOcrResult(invoiceId);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.isSuccess()).isTrue();
        assertThat(result.getConfidence()).isEqualTo(0.92);
        assertThat(result.getStructuredData()).isNotNull();
        assertThat(result.getStructuredData().get("invoiceNumber")).isEqualTo("INV-2024-001");
        assertThat(result.getStructuredData().get("supplierName")).isEqualTo("ABC Textiles Ltd");
        assertThat(result.getStructuredData().get("totalAmount")).isEqualTo(20650.0);
        assertThat(result.getStructuredData().get("dueDate")).isEqualTo("2024-02-14");
    }

    @Test
    void getOcrResult_successfullyParsesFullOcrResultJson() throws Exception {
        OcrResult fullResult = new MockOcrProvider().process(new byte[0], "application/pdf");
        String fullJson = objectMapper.writeValueAsString(fullResult);

        Organization org = new Organization();
        org.setId(orgId);

        SupplierInvoice invoice = SupplierInvoice.builder()
                .ocrStatus(OcrStatus.COMPLETED)
                .ocrConfidence(0.92)
                .ocrRawData(fullJson)
                .organization(org)
                .build();
        invoice.setId(invoiceId);

        when(invoiceRepository.findById(invoiceId)).thenReturn(Optional.of(invoice));

        // When
        OcrResult result = ocrService.getOcrResult(invoiceId);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.isSuccess()).isTrue();
        assertThat(result.getConfidence()).isEqualTo(0.92);
        assertThat(result.getLineItems()).isNotEmpty();
        assertThat(result.getLineItems()).hasSize(3);
        assertThat(result.getLineItems().get(0).getDescription()).isEqualTo("Cotton Socks Black M");
    }

    @Test
    void getOcrResult_throwsExceptionWhenNoOcrData() {
        Organization org = new Organization();
        org.setId(orgId);

        SupplierInvoice invoice = SupplierInvoice.builder()
                .ocrStatus(OcrStatus.PENDING)
                .ocrRawData(null)
                .organization(org)
                .build();
        invoice.setId(invoiceId);

        when(invoiceRepository.findById(invoiceId)).thenReturn(Optional.of(invoice));

        assertThatThrownBy(() -> ocrService.getOcrResult(invoiceId))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("No OCR data available");
    }
}
