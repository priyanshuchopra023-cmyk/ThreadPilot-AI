# THREADPILOT AI — MCA MAJOR PROJECT RUBRICS III CONTEXT REPORT

---

## 1. Project Overview and Objectives

**ThreadPilot AI** is a multi-tenant, cloud-native SaaS ERP platform and AI "Business Brain" engineered for small and medium-sized hosiery and textile manufacturers, distributors, and wholesalers.

### Domain Challenges
* **Multi-Attribute Product Variants**: Textile garments and fabrics require tracking across size, color, GSM, fabric composition, and roll batches.
* **Credit Cycle Friction**: Informal 30–90 day credit terms cause severe cash flow bottlenecks, unnoticed credit limit breaches, and customer dormancy.
* **Invoice & Document Reconciliation**: High-volume physical and semi-structured supplier bills cause ledger discrepancies between POs, physical receipts, and payables.
* **Dead Stock Accumulation**: Fast seasonal turnaround traps working capital in slow-moving textile inventory without early detection.

### Core Objectives
1. **Ledger & Financial Integrity**: Enforce decimal-safe arithmetic (`BigDecimal`) across order fulfillment, tax rules, discounts, overpayment prevention, and balance reconciliations.
2. **Tenant Data Isolation**: Guarantee organization-scoped partitioning across all database transactions, REST controllers, and background jobs.
3. **Domain Textile Intelligence**: Compute automated operational insights: due-date-relative receivables aging, credit risk classification, daily prioritized actions, and inventory velocity scoring.
4. **Grounded AI Copilot ("Thread AI")**: Deliver a natural-language conversational copilot whose answers are strictly grounded in deterministic backend analytics, eliminating LLM hallucinations.

---

## 2. Technology Stack and Architecture

ThreadPilot AI follows a decoupled three-tier micro-modular SaaS architecture:

```
[ React 18 + Vite (Port 3000) ]  <---(REST / JWT)--->  [ Spring Boot 3.2.5 (Port 8080/api) ]
                                                            |-- Security & TenantContext Filter
                                                            |-- Business Logic & Analytics Engine
                                                            |-- Copilot & Grounded Tool Dispatcher
                                                            |-- Quartz Scheduler
                                                            +-- Spring Data JPA / Hibernate 6.4
                                                                 |                 |
                                                                 v                 v
                                                       [ PostgreSQL 16 ]     [ Redis 7 Cache ]
```

* **Backend**: Java 21/23 (release 21), Spring Boot 3.2.5, Spring Data JPA, Hibernate 6.4.4.Final, HikariCP.
* **Database & Migrations**: PostgreSQL 16.15 (UUID keys, decimal precision), Flyway Community 9.22.3 (migrations V1–V4).
* **Caching**: Redis 7.4.11 via Lettuce driver.
* **Security**: Spring Security 6 with stateless JWT (`jjwt` 0.12.5, HMAC-SHA256, 256-bit Base64 key validation).
* **Scheduling**: Quartz Scheduler 2.3.2 (RAMJobStore, daily multi-tenant alert sweeps).
* **DTO Mapping & Utilities**: MapStruct 1.5.5.Final, Project Lombok 1.18.32, Jackson 2.15.
* **Frontend**: React 18.2.0, TypeScript 5.3.3, Vite 5.0.12 (strict port 3000, API proxy), Tailwind CSS 3.4.1, Framer Motion 11.0.3, TanStack React Query v5.17.0, Zustand 4.5.0, React Router DOM 6.22.0, React Hook Form 7.49.3 + Zod 3.22.4, Recharts 2.10.4, Lucide React 0.312.0, Axios 1.6.5.
* **AI & OCR**: NVIDIA Nemotron (`nemotron-3-ultra-550b-a55b`) via OpenAI-compatible API; `MockAIProvider` for offline deterministic local execution; pluggable `OcrProvider` (regex pattern extractor and Tesseract integration).

---

## 3. Project Directory Structure

```
ThreadPilot AI/
├── docker-compose.yml              # PostgreSQL 16 and Redis 7 services
├── backend/
│   ├── pom.xml / .env
│   └── src/
│       ├── main/java/com/threadpilot/
│       │   ├── ThreadPilotApplication.java # Bootstrap with automated .env loader
│       │   ├── ai/                 # AIProvider, AIProviderFactory, Mock & Nvidia providers
│       │   ├── alert/              # Alert entity, repository, and Quartz scheduled service
│       │   ├── analytics/          # Receivables aging, credit risk, action center logic
│       │   ├── audit/              # AuditLog entity and immutable audit logging service
│       │   ├── auth/               # Login, register, refresh, password controllers & DTOs
│       │   ├── common/             # BaseEntity, ApiResponse, PaginationRequest, GlobalExceptionHandler
│       │   ├── config/             # AsyncConfig, RedisConfig, OpenApiConfig
│       │   ├── copilot/            # CopilotController, CopilotService, tool execution engine
│       │   ├── customer/           # Customer entity, credit controls, receivables queries
│       │   ├── dashboard/          # Dashboard metrics and summary statistics
│       │   ├── event/              # BusinessEvent domain entity and event audit trail
│       │   ├── expense/            # Expense tracking, categories, and date-range summaries
│       │   ├── inventory/          # Inventory levels, stock movement audits, threshold alerts
│       │   ├── invoice/            # Supplier invoices, itemized line totals, OCR approval
│       │   ├── ocr/                # OcrService, OcrController, document text extraction
│       │   ├── order/              # Customer orders, fulfillment workflow, credit checks
│       │   ├── organization/       # Organization tenant entity, controller, and repository
│       │   ├── payment/            # PaymentService, customer/supplier ledgers, overpayment guards
│       │   ├── product/            # Product catalog, textile variants (sizes, colors, GSM)
│       │   ├── reminder/           # Payment reminder entity, repository, and controller
│       │   ├── sale/               # Direct point-of-sale invoices and sales reporting
│       │   ├── search/             # Global multi-entity full-text search service
│       │   ├── security/           # JWT filters, TenantContext (ThreadLocal), SecurityConfig
│       │   ├── storage/            # Local disk and cloud S3 file storage providers
│       │   ├── supplier/           # Supplier directory, purchase orders, payables
│       │   └── user/               # User, Role, and Role-Based Access Control (RBAC)
│       ├── main/resources/
│       │   ├── application.yml     # Configuration, actuator, and security profiles
│       │   └── db/migration/       # Flyway SQL scripts (V1__initial to V4__org_code)
│       └── test/                   # Unit, financial integrity, and integration test suites
└── frontend/
    ├── package.json / vite.config.ts
    └── src/
        ├── api/                    # Axios client and centralized endpoint definitions
        ├── components/             # brand/, dashboard/, forms/, layout/, tables/, ui/
        │   └── intelligence/       # CustomerCreditCard, DailyActionCenterCard, ReceivablesAgingCard, TextileIntelligenceCard
        ├── pages/                  # Dashboard, Customers, Products, Inventory, Orders, Sales,
        │                           # Suppliers, Invoices, Payments, Expenses, Alerts, ThreadAI, Settings
        └── types/                  # TypeScript interfaces matching backend models and DTOs
```

---

## 4. Major Implemented Functional Modules

1. **Authentication & Multi-Tenancy**: Organization registration, JWT access/refresh lifecycle, and request-scoped `TenantContext` isolation via JWT claims.
2. **Textile Product Master & Variants**: Parent-child product hierarchy tracking sizes, colors, GSM, barcodes, and SKU codes.
3. **Inventory & Stock Movements**: Real-time tracking of current, allocated, and available stock, with immutable `StockMovement` audit logs.
4. **Customer Credit Management**: Credit limit enforcement, customer balance tracking, payment turnaround metrics, and credit status management.
5. **Customer Orders & Fulfillment**: Quote-to-order-to-shipment workflow with credit checks before confirmation and partial shipment tracking.
6. **Direct Sales**: Direct over-the-counter textile sales with instant inventory decrement and revenue ledger creation.
7. **Suppliers & Purchase Orders**: Supplier directory, raw material procurement POs, delivery receipts, and payable tracking.
8. **Supplier Invoices & OCR Pipeline**: Multi-format document upload, OCR line-item extraction, review modal, and accounts payable verification.
9. **Payments & Ledger Reconciliation**: Customer receipts, supplier payments, partial payment allocation, and overpayment prevention.
10. **Expense Management**: Categorized tracking of operating costs (logistics, wages, packaging, utilities) with period summaries.
11. **Automated Business Alerts**: Quartz scheduler automatically creates tenant-isolated alerts for stock shortages, overdue receivables, and invoice anomalies.
12. **Business Brain Analytics Engine**: Real-time due-date-relative receivables aging, credit risk segmentation, business health scoring, and daily prioritized actions.
13. **Thread AI Copilot**: Grounded natural-language query interface calling backend analytics tools to provide context-aware textile insights.

---

## 5. Important Database Entities and Relational Architecture

The relational database comprises **27 tables** managed by versioned Flyway migrations:

* **Core Tenant & Users**: `organizations` (tenant root), `users`, `roles`, `user_roles`.
* **Product Catalog**: `products` (1:N) `product_variants` (SKU, size, color, GSM, barcode).
* **Inventory**: `inventory` (1:1 with product/variant), `stock_movements` (audit trail of all stock changes).
* **Customer & Sales**: `customers` (1:N) `customer_orders` (1:N) `customer_order_items`; `customers` (1:N) `sales` (1:N) `sale_items`.
* **Procurement & Payables**: `suppliers` (1:N) `purchase_orders` (1:N) `purchase_order_items`; `suppliers` (1:N) `supplier_invoices` (1:N) `supplier_invoice_items`.
* **Financial Ledger**: `payments` (FKs to `organization_id`, `customer_id`, `supplier_id`, `customer_order_id`, `supplier_invoice_id`).
* **Operational & Audit**: `expenses`, `business_events`, `alerts`, `reminders`, `audit_logs`.
* **Thread AI Memory**: `ai_conversations` (1:N) `ai_messages` (persisting token usage, tool calls, and serialized JSON tool results).

---

## 6. Representative REST API Endpoints

| Method | Endpoint Path | Module | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Auth | Authenticates user; issues JWT access and refresh tokens. |
| `POST` | `/api/auth/refresh` | Auth | Issues new access token from valid refresh token. |
| `GET` | `/api/dashboard/stats` | Dashboard | Returns key metrics (sales, orders, low stock, receivables). |
| `GET` | `/api/analytics/receivables-aging` | Business Brain | Computes overdue debt aging (0–30, 31–60, 61–90, 90+ days). |
| `GET` | `/api/analytics/customer-credit-intelligence` | Business Brain | Returns credit breaches, inactive accounts, and collection risks. |
| `GET` | `/api/analytics/action-center` | Business Brain | Delivers prioritized daily business tasks with financial impact. |
| `GET` | `/api/analytics/textile-product-intelligence` | Business Brain | Analyzes SKU velocities, fabric stock coverage days, and deadstock. |
| `POST` | `/api/orders` | Orders | Creates customer order with itemized textile variants, tax, and discounts. |
| `POST` | `/api/orders/{id}/confirm` | Orders | Validates credit limit and reserves stock upon order confirmation. |
| `POST` | `/api/sales` | Sales | Records direct textile sale, generates invoice, and decrements inventory. |
| `POST` | `/api/payments/customer` | Payments | Records customer receipt, prevents overpayment, and updates ledger. |
| `POST` | `/api/invoices/{id}/document` | OCR / Invoices | Uploads invoice document for OCR extraction. |
| `POST` | `/api/invoices/{id}/verify` | Invoices | Verifies extracted invoice items and registers into accounts payable. |
| `POST` | `/api/copilot/chat` | Thread AI | Natural-language query interface powered by grounded tool execution. |

---

## 7. Thread AI and Business Brain Implementation

ThreadPilot AI combines deterministic business analytics with grounded conversational AI:

```
[ User: "Who owes us money past 60 days?" ]
                   |
                   v
   [ CopilotService.determineToolCalls() ]  --> Identifies intent: "getReceivablesAging"
                   |
                   v
 [ AnalyticsService.getReceivablesAging() ]  --> Executes deterministic PostgreSQL calculation
                   |
                   v
 [ AIProvider.chat() (NVIDIA / Mock) ]      --> Injects verified data; generates factual answer
```

### Business Brain Intelligence Components
1. **Receivables Aging**: Computes overdue durations using `ChronoUnit.DAYS.between(dueDate, today)`. Unlike systems that evaluate creation dates, it evaluates payment terms (Net 30/60) to avoid false overdue flags.
2. **Customer Credit Risk Matrix**: Categorizes accounts into:
   * `CREDIT_LIMIT_BREACHED`: Outstanding balance exceeds authorized ceiling.
   * `HIGH_SALES_POOR_COLLECTION`: Top 20% by sales volume with collection ratios under 50%.
   * `INACTIVE_WITH_BALANCE`: No orders within 60+ days with unpaid balances.
   * `REACTIVATION_OPPORTUNITY`: Inactive customers with zero outstanding balance.
3. **Daily Action Center**: Generates prioritized operational actions ranked by urgency (`HIGH`, `MEDIUM`, `LOW`) with quantifiable financial values and direct record links.

### AI Engine Architecture
* **Grounded Tool Dispatch**: Queries map to 15 specialized tools (`getReceivablesAging`, `getCustomerCreditIntelligence`, `getDailyActionCenter`, `getTextileProductIntelligence`, `getLowStockProducts`, `getSalesSummary`, etc.).
* **Zero-Hallucination Design**: Verified tool outputs are injected into prompt context. The AI summarizes real figures rather than approximating numbers.
* **Dual Providers**: `NvidiaAIProvider` for cloud deployment; `MockAIProvider` for local offline testing.

---

## 8. Important Genuine Code Snippets

### Snippet 1: Financial & Balance Integrity (`PaymentService.java`)
```java
@Transactional
public Payment recordCustomerPayment(Payment payment) {
    final UUID orgId = TenantContext.requireTenantId();
    final UUID userId = TenantContext.getUserId();

    if (payment.getAmount() == null || payment.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
        throw new BusinessException("INVALID_AMOUNT", "Payment amount must be greater than zero");
    }

    Customer customer = findCustomerByIdAndOrg(payment.getCustomer().getId(), orgId);

    if (payment.getPaymentNumber() == null || payment.getPaymentNumber().trim().isEmpty()) {
        payment.setPaymentNumber("PAY-CUST-" + System.currentTimeMillis() + "-" + 
                UUID.randomUUID().toString().substring(0, 4).toUpperCase());
    }

    payment.setCustomer(customer);
    payment.setOrganization(new Organization() {{ setId(orgId); }});
    payment.setPaymentType(PaymentType.CUSTOMER_PAYMENT);
    payment.setRecordedBy(userId != null ? userRepository.findById(userId).orElse(null) : null);

    // Validate order and prevent overpayment
    if (payment.getCustomerOrder() != null && payment.getCustomerOrder().getId() != null) {
        CustomerOrder order = findCustomerOrderByIdAndOrg(payment.getCustomerOrder().getId(), orgId);
        if (payment.getAmount().compareTo(order.getOutstandingAmount()) > 0) {
            throw new BusinessException("OVERPAYMENT_NOT_ALLOWED",
                    "Payment amount (" + payment.getAmount() + ") cannot exceed order balance (" + order.getOutstandingAmount() + ")");
        }
        order.setPaidAmount(order.getPaidAmount().add(payment.getAmount()));
        order.updateOutstanding();
        orderRepository.save(order);
    }

    payment = paymentRepository.save(payment);

    // Update customer outstanding balance safely clamped to >= 0
    BigDecimal newCustomerBalance = customer.getOutstandingAmount().subtract(payment.getAmount());
    if (newCustomerBalance.compareTo(BigDecimal.ZERO) < 0) {
        newCustomerBalance = BigDecimal.ZERO;
    }
    customer.setOutstandingAmount(newCustomerBalance);
    customerRepository.save(customer);

    createBusinessEvent(payment, EventType.PAYMENT_RECEIVED, "Customer payment received: " + payment.getAmount());
    return payment;
}
```

### Snippet 2: Stateless Multi-Tenant Context (`TenantContext.java`)
```java
package com.threadpilot.security;

import java.util.UUID;

public class TenantContext {

    private static final ThreadLocal<UUID> currentOrganizationId = new ThreadLocal<>();
    private static final ThreadLocal<UUID> currentUserId = new ThreadLocal<>();

    private TenantContext() {}

    public static void setOrganizationId(UUID organizationId) { currentOrganizationId.set(organizationId); }
    public static UUID getOrganizationId() { return currentOrganizationId.get(); }

    public static void setUserId(UUID userId) { currentUserId.set(userId); }
    public static UUID getUserId() { return currentUserId.get(); }

    public static void clear() {
        currentOrganizationId.remove();
        currentUserId.remove();
    }

    public static boolean hasTenant() { return currentOrganizationId.get() != null; }

    public static UUID requireTenantId() {
        if (!hasTenant()) {
            throw new IllegalStateException("No tenant context available");
        }
        return getOrganizationId();
    }
}
```

### Snippet 3: Grounded AI Tool Execution (`CopilotService.java`)
```java
private ToolResult executeTool(ToolCall toolCall, BusinessContextService.BusinessContext context) {
    return switch (toolCall.getName()) {
        case "getReceivablesAging" -> new ToolResult(toolCall.getName(), true,
                analyticsService.getReceivablesAging(), null);
        case "getCustomerCreditIntelligence" -> new ToolResult(toolCall.getName(), true,
                analyticsService.getCustomerCreditIntelligence(), null);
        case "getDailyActionCenter" -> new ToolResult(toolCall.getName(), true,
                analyticsService.getDailyActionCenter(), null);
        case "getTextileProductIntelligence" -> new ToolResult(toolCall.getName(), true,
                analyticsService.getTextileProductIntelligence(), null);
        case "getCustomerOutstanding" -> new ToolResult(toolCall.getName(), true,
                context.getTopCustomersByOutstanding().stream()
                        .map(c -> Map.of("customer", c.getName(), 
                                         "outstanding", c.getOutstandingAmount(), 
                                         "creditLimit", c.getCreditLimit()))
                        .toList(), null);
        case "getLowStockProducts" -> new ToolResult(toolCall.getName(), true,
                context.getLowStockProducts().stream()
                        .map(i -> Map.of("product", i.getProduct() != null ? i.getProduct().getName() : "Variant",
                                         "available", i.getAvailableQuantity()))
                        .toList(), null);
        default -> new ToolResult(toolCall.getName(), false, null, "Unknown tool: " + toolCall.getName());
    };
}
```

---

## 9. Actual Testing and Local Startup Status

### Test Execution Status
* **Backend Automated Tests**: Executed suites: `ComprehensiveVerificationTest`, `FinancialIntegrityTest`, `PaymentBusinessRulesTest`, `JwtServiceValidationTest`. Results: **29/29 tests PASSED** (0 failures, 0 errors, 0 skipped).
* **Frontend TypeScript & Build Verification**: `npx tsc --noEmit` passed with **0 type errors**. `npx vite build` succeeded, bundling 1,582 production modules in 11.87 seconds.

### Local Execution Architecture & Verified Endpoints
* **Backend**: Spring Boot 3.2.5 running on embedded Tomcat at `http://localhost:8080/api`. Health endpoint `GET /api/actuator/health` returns HTTP 200 `{"status":"UP"}` confirming healthy connections to PostgreSQL and Redis.
* **Frontend**: Vite 5.0.12 dev server running on port `3000` (`0.0.0.0`), reverse-proxying `/api` requests to backend port 8080.
* **Containers**: PostgreSQL 16.15 on `localhost:5432` (Flyway schema at version 4); Redis 7.4.11 on `localhost:6379`.
* **API Documentation**: Swagger UI active at `http://localhost:8080/api/swagger-ui/index.html`.

---

## 10. Current Limitations and Future Scope

### Current Limitations
1. **OCR Document Recognition**: Relies on rule-based regex parsing and local OCR. Multi-column Indian GST textile invoices with stamps or handwritten adjustments require manual review.
2. **Payment Gateway Settlement**: Ledger entries support manual cash, cheque, NEFT, and UPI references; automated direct webhook settlement via Razorpay/Cashfree is not yet connected.
3. **Standalone Redis Cache**: Redis runs as a single instance; distributed cluster and read-replica modes are not yet configured.
4. **Mocked Email Service**: Outgoing email notifications log to console unless external SMTP credentials are provided.

### Future Scope
1. **WhatsApp Business API Integration**: One-click dispatch of automated, localized payment reminders and invoice PDFs directly from the Action Center.
2. **Predictive Seasonal Demand Forecasting**: Machine learning time-series models (Prophet/XGBoost) for yarn and garment seasonal demand spikes tied to regional festival calendars.
3. **Warehouse QR / RFID Mobile Client**: Mobile barcode/RFID scanner application for fabric rolls and garment bundles during warehouse audits and dispatch.
4. **Automated GST & e-Way Bill Portal Sync**: Direct API integration with the Indian National Informatics Centre (NIC) e-Way bill and GST e-invoicing systems for automated tax compliance.
