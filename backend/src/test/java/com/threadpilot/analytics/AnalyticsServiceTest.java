package com.threadpilot.analytics;

import com.threadpilot.customer.CustomerRepository;
import com.threadpilot.event.BusinessEventRepository;
import com.threadpilot.expense.ExpenseRepository;
import com.threadpilot.inventory.InventoryRepository;
import com.threadpilot.inventory.StockMovementRepository;
import com.threadpilot.payment.PaymentRepository;
import com.threadpilot.product.ProductRepository;
import com.threadpilot.sale.SaleRepository;
import com.threadpilot.security.TenantContext;
import com.threadpilot.supplier.SupplierRepository;
import com.threadpilot.user.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AnalyticsServiceTest {

    @Mock
    private SaleRepository saleRepository;
    @Mock
    private PaymentRepository paymentRepository;
    @Mock
    private InventoryRepository inventoryRepository;
    @Mock
    private StockMovementRepository stockMovementRepository;
    @Mock
    private ProductRepository productRepository;
    @Mock
    private SupplierRepository supplierRepository;
    @Mock
    private ExpenseRepository expenseRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private BusinessEventRepository businessEventRepository;
    @Mock
    private CustomerRepository customerRepository;

    @InjectMocks
    private AnalyticsService analyticsService;

    private UUID tenantId;

    @BeforeEach
    void setUp() {
        tenantId = UUID.randomUUID();
        TenantContext.setOrganizationId(tenantId);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void getBusinessHealthScore_whenEmptyTenant_returnsNullScoresAndInsufficientData() {
        when(productRepository.countActiveByOrganizationId(tenantId)).thenReturn(0L);
        when(saleRepository.getTotalRevenueByDateRange(eq(tenantId), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(BigDecimal.ZERO);
        when(customerRepository.getTotalOutstanding(tenantId)).thenReturn(BigDecimal.ZERO);
        when(supplierRepository.getTotalOutstanding(tenantId)).thenReturn(BigDecimal.ZERO);

        AnalyticsService.BusinessHealthScore score = analyticsService.getBusinessHealthScore();

        assertNotNull(score);
        assertNull(score.getOverallScore(), "Overall score must be null when there is no activity data");
        assertNull(score.getInventoryHealth(), "Inventory health must be null when there are no products");
        assertNull(score.getSalesHealth(), "Sales health must be null when there are no sales");
        assertNull(score.getCollectionsHealth(), "Collections health must be null when there are no receivables or payables");
        assertNull(score.getProfitabilityHealth(), "Profitability health must be null when there is no revenue");
        assertNull(score.getSlowMovingHealth(), "Slow moving health must be null when there are no products");
        assertFalse(score.getHasSufficientData());
        assertEquals("Not enough data to calculate operational baseline", score.getStatusMessage());
    }

    @Test
    void getBusinessHealthScore_whenProductsAndSalesExist_calculatesGenuineMetrics() {
        when(productRepository.countActiveByOrganizationId(tenantId)).thenReturn(10L);
        when(inventoryRepository.countLowStock(tenantId, 10)).thenReturn(1L);
        when(productRepository.countSlowMoving(eq(tenantId), any(LocalDate.class))).thenReturn(2L);

        // Sales: 10,000 this month, 8,000 previous month -> growth = 25% -> sales health = 50 + 25 = 75
        when(saleRepository.getTotalRevenueByDateRange(eq(tenantId), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(BigDecimal.valueOf(10000), BigDecimal.valueOf(8000), BigDecimal.valueOf(10000));
        when(saleRepository.getTotalGrossProfitByDateRange(eq(tenantId), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(BigDecimal.valueOf(3000)); // 30% margin * 2.5 = 75

        // Receivables: 5,000, Payables: 2,500 -> ratio 0.5 -> 100 - 25 = 75
        when(customerRepository.getTotalOutstanding(tenantId)).thenReturn(BigDecimal.valueOf(5000));
        when(supplierRepository.getTotalOutstanding(tenantId)).thenReturn(BigDecimal.valueOf(2500));

        AnalyticsService.BusinessHealthScore score = analyticsService.getBusinessHealthScore();

        assertNotNull(score);
        assertTrue(score.getHasSufficientData());
        assertNotNull(score.getOverallScore());
        // Inventory health: (10 - 1) / 10 * 100 = 90%
        assertEquals(90, score.getInventoryHealth());
        // Slow moving health: (10 - 2) / 10 * 100 = 80%
        assertEquals(80, score.getSlowMovingHealth());
        // Sales velocity score: 50 + 25 = 75%
        assertEquals(75, score.getSalesHealth());
        // Collections score: 100 - (0.5 * 50) = 75%
        assertEquals(75, score.getCollectionsHealth());
        // Profitability score: 30% * 2.5 = 75%
        assertEquals(75, score.getProfitabilityHealth());
        // Overall: 90*0.25 + 75*0.20 + 75*0.20 + 75*0.20 + 80*0.15 = 22.5 + 15 + 15 + 15 + 12 = 79.5 -> 80
        assertEquals(80, score.getOverallScore());
    }
}
