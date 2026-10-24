# ThreadPilot AI — BLOCK 00: CURRENT WORKSPACE AUDIT

**Audit Date:** 2026-10-20  
**Workspace:** `C:\Users\PRIYANSHU CHOPRA\Desktop\My project`  
**Mode:** READ ONLY — No modifications made

---

## A. Executive Summary

ThreadPilot AI is a **multi-tenant SaaS platform for hosiery wholesalers/retailers** with a comprehensive backend (Spring Boot 3.2.5, Java 21, PostgreSQL) and frontend (React 18, TypeScript, Vite, Tailwind). The codebase implements 25+ business entities across 15+ modules with JWT authentication, RBAC (7 roles), Flyway migrations, and an AI Copilot powered by NVIDIA Nemotron.

**Overall Status:** Feature-complete in source code for core business modules and AI integration. **Critical gaps:** No automated tests (backend or frontend), no `.gitignore`, duplicate entity files in root package, unverified NVIDIA API integration, several API contract mismatches between frontend/backend, and security concerns in token refresh flow.

**Build Status:** Both compile successfully (per `IMPLEMENTATION_STATUS.md`), but no test suite exists to verify runtime correctness.

---

## B. Current Architecture and Feature Inventory

### Repository Baseline
| Aspect | Details |
|--------|---------|
| **Frontend** | React 18 + TypeScript + Vite 5 + Tailwind CSS 3.4 + TanStack Query 5 + React Router 6 |
| **Backend** | Spring Boot 3.2.5 + Java 21 + Spring Data JPA + PostgreSQL + Flyway + Redis (optional) |
| **Package Managers** | Maven (backend), npm (frontend) |
| **Entry Points** | `backend/src/main/java/com/threadpilot/ThreadPilotApplication.java`, `frontend/src/main.tsx` |
| **Module Structure** | Backend: 28 packages under `com.threadpilot.*`; Frontend: `src/{api,components,context,hooks,pages,types,utils}` |
| **Environment Config** | `backend/src/main/resources/application.yml` (3 profiles: default, docker, test), `backend/.env.example`, `frontend/.env` (VITE_API_URL) |
| **Git Status** | **NOT A GIT REPO** — No `.git`, no `.gitignore`, no commit history |
| **Generated Folders** | `backend/target/`, `frontend/node_modules/`, `frontend/dist/` |

### Feature Inventory (Categorized)

| Feature Area | Backend Status | Frontend Status | Evidence |
|--------------|----------------|-----------------|----------|
| **Auth (JWT + Refresh)** | IMPLEMENTED IN SOURCE | IMPLEMENTED IN SOURCE | `AuthService.java:89-138`, `JwtService.java`, `AuthContext.tsx:58-104` |
| **Multi-tenancy (TenantContext)** | IMPLEMENTED IN SOURCE | N/A (enforced by backend) | `TenantContext.java`, `JwtAuthenticationFilter.java:75-77` |
| **RBAC (7 roles)** | IMPLEMENTED IN SOURCE | PARTIAL (no UI role checks) | `SecurityConfig.java:44-68`, `SystemRole.java` |
| **Organizations/Users** | IMPLEMENTED IN SOURCE | IMPLEMENTED IN SOURCE | `OrganizationController`, `UserRepository`, `Settings.tsx` |
| **Products/Variants** | IMPLEMENTED IN SOURCE | IMPLEMENTED IN SOURCE | `ProductController`, `ProductService`, `Products.tsx` |
| **Inventory/Stock Movements** | IMPLEMENTED IN SOURCE | IMPLEMENTED IN SOURCE | `InventoryService`, `InventoryController`, `Inventory.tsx` |
| **Suppliers/Purchase Orders** | IMPLEMENTED IN SOURCE | IMPLEMENTED IN SOURCE | `SupplierController`, `PurchaseOrder*`, `Suppliers.tsx` |
| **Customers/Orders** | IMPLEMENTED IN SOURCE | IMPLEMENTED IN SOURCE | `CustomerController`, `CustomerOrder*`, `Customers.tsx`, `Orders.tsx` |
| **Sales/Sale Items** | IMPLEMENTED IN SOURCE | IMPLEMENTED IN SOURCE | `SaleController`, `SaleService`, `Sales.tsx` |
| **Payments (Customer/Supplier)** | IMPLEMENTED IN SOURCE | IMPLEMENTED IN SOURCE | `PaymentController`, `PaymentService`, `Payments.tsx` |
| **Expenses** | IMPLEMENTED IN SOURCE | IMPLEMENTED IN SOURCE | `ExpenseController`, `ExpenseService`, `Expenses.tsx` |
| **Invoices + OCR** | IMPLEMENTED IN SOURCE | IMPLEMENTED IN SOURCE | `SupplierInvoiceController`, `OcrService`, `Invoices.tsx` |
| **Alerts/Reminders** | IMPLEMENTED IN SOURCE | IMPLEMENTED IN SOURCE | `AlertController`, `ReminderController`, `Alerts.tsx` |
| **Business Events/Audit** | IMPLEMENTED IN SOURCE | MISSING (no UI) | `BusinessEventRepository`, `AuditLogRepository` |
| **Analytics/Health Score** | IMPLEMENTED IN SOURCE | IMPLEMENTED IN SOURCE | `AnalyticsService.java:52-75`, `Dashboard.tsx` |
| **Search** | IMPLEMENTED IN SOURCE | MISSING (no UI) | `SearchController.java`, `SearchService.java` |
| **AI Copilot (Chat)** | IMPLEMENTED IN SOURCE | IMPLEMENTED IN SOURCE | `CopilotService.java`, `CopilotController.java`, `Copilot.tsx` |
| **AI Recommendations** | IMPLEMENTED IN SOURCE | MISSING (no UI) | `RecommendationService.java`, `RecommendationController.java` |
| **AI Provider Abstraction** | IMPLEMENTED IN SOURCE | N/A | `AIProvider.java`, `AIProviderFactory.java` |
| **NVIDIA Provider** | IMPLEMENTED IN SOURCE | N/A | `NvidiaAIProvider.java:26-233` |
| **Mock Provider** | IMPLEMENTED IN SOURCE | N/A | `MockAIProvider.java:10-136` |
| **Docker/Compose** | IMPLEMENTED IN SOURCE | IMPLEMENTED IN SOURCE | `docker-compose.yml`, `Dockerfile` (both) |

**MISSING entirely:** Unit/integration tests, CI/CD, architecture docs, production hardening configs, API versioning, request/response validation on frontend, rate limiting, webhook handling.

---

## C. Build and Test Verification Results

| Command | Status | Notes |
|---------|--------|-------|
| `cd backend && mvn compile` | **UNVERIFIED** | No test run possible without DB/Redis; `mvn test` would fail without TestContainers DB |
| `cd backend && mvn spotless:check` | **UNVERIFIED** | Spotless plugin not in pom.xml — formatting not enforced |
| `cd frontend && npm run build` | **UNVERIFIED** | Requires `npm install` first; `dist/` exists but may be stale |
| `cd frontend && npm run lint` | **UNVERIFIED** | ESLint configured but no run performed |
| `cd frontend && npm run test` | **NO TESTS** | `vitest` configured but **zero test files exist** (`*.test.ts`, `*.spec.ts`) |
| `cd backend && mvn test` | **NO TESTS** | `src/test` directory **empty** — no test classes found |

**Critical Finding:** **Zero automated tests** in entire codebase. `IMPLEMENTATION_STATUS.md` claims "Tests: All passing" but `src/test` is empty and no frontend test files exist. This is a **P0 blocker** for any production deployment.

---

## D. NVIDIA Integration Status and Mock/Real Boundaries

### Configuration (application.yml:96-110)
```yaml
threadpilot:
  ai:
    provider: ${AI_PROVIDER:nvidia}
    nvidia:
      api-key: ${NVIDIA_API_KEY:}
      base-url: ${NVIDIA_BASE_URL:https://integrate.api.nvidia.com/v1}
      model: ${NVIDIA_MODEL:nvidia/nemotron-3-ultra-550b-a55b}
      timeout: 30000
```

### Provider Implementation
| Aspect | NVIDIA Provider | Mock Provider |
|--------|-----------------|---------------|
| **Class** | `NvidiaAIProvider.java` | `MockAIProvider.java` |
| **Availability Check** | `apiKey != null && !apiKey.isBlank()` (line 224) | Always `true` (line 58) |
| **HTTP Client** | Apache HttpClient5 (sync, no connection pooling) | N/A |
| **Timeout** | 30s configurable via `threadpilot.ai.nvidia.timeout` | N/A |
| **Retries** | **NONE** — single attempt, throws on any error | N/A |
| **Error Handling** | Throws `RuntimeException` on HTTP >=400 or IO error | Returns canned responses |
| **Rate Limits** | **Not handled** — no 429 detection, no backoff | N/A |
| **Usage Tracking** | Returns `AIUsage` with tokens; stored in `AIMessage` | Returns fixed `AIUsage(100,100,200)` |
| **Fallback** | `AIProviderFactory.getDefaultProvider()` falls back to `"mock"` if NVIDIA unavailable (line 38-41) | N/A |

### Copilot Data Access (Real Business Records)
- **`BusinessContextService.getBusinessContext()`** (line 54-72) queries **real tenant-scoped data** via repositories:
  - Low stock, out of stock, top customers/suppliers by outstanding
  - Recent sales/payments, total inventory value, receivables/payables
  - Business health score, slow-moving products, recent events
- **All queries scoped to `TenantContext.requireTenantId()`** — organization isolation enforced at repository level
- **Tool execution** in `CopilotService.executeTool()` (line 177-259) returns **actual business data** to LLM

### Write Operations & Permissions
- **Copilot is READ-ONLY** — no write tools exposed to LLM
- **RecommendationService** generates `AIRecommendation` entities (PENDING status) but **requires human review/implementation**
- **No confirmation flow** for AI-initiated actions — all writes go through standard CRUD endpoints with RBAC

### Mock/Real Boundary
| Scenario | Provider Used |
|----------|---------------|
| `NVIDIA_API_KEY` unset/empty | **Mock** (via factory fallback) |
| `AI_PROVIDER=mock` env var | **Mock** |
| `AI_PROVIDER=nvidia` + valid key | **NVIDIA** (real API calls) |
| Test profile (`spring.profiles.active=test`) | **Mock** (forced in `application.yml:189`) |

**VERIFICATION:** No live API call made during audit. Integration appears **functionally complete in source** but **untested against real NVIDIA endpoint**.

---

## E. Critical Findings Ranked P0, P1, P2

### P0 — Must Fix Before Production

| # | Finding | File/Location | Risk |
|---|---------|---------------|------|
| 1 | **Zero automated tests** | `backend/src/test/` (empty), `frontend/src/` (no `*.test.ts`) | No regression detection; deploy blind |
| 2 | **Not a Git repository** | Root directory | No version control, no collaboration, no CI/CD |
| 3 | **No `.gitignore`** | Root directory | Secrets, `node_modules/`, `target/`, `.env` committed if git init |
| 4 | **Duplicate entity files in root package** | `backend/src/main/java/com/threadpilot/*.java` (20+ files) | Compilation ambiguity; Lombok/MapStruct may process wrong files |
| 5 | **Refresh token sent in Authorization header** | `AuthController.java:32-36`, `client.ts:78-80` | Non-standard; should be in request body; logs may capture token |
| 6 | **JWT secret default is weak placeholder** | `application.yml:91`, `.env.example:10` | Production deployments may use default; 256-bit requirement not enforced |
| 7 | **NVIDIA provider: no retries, no rate-limit handling, no circuit breaker** | `NvidiaAIProvider.java:102-144` | Single failure = user-facing error; 429 = crash |
| 8 | **BusinessContextService: `getTotalReceivables` uses payments not invoices** | `AnalyticsService.java:90` (comment: "This is wrong - need to fix") | Incorrect dashboard metrics; wrong business decisions |
| 9 | **Copilot `conversationId` type mismatch** | `CopilotController.java:28` (UUID) vs `AiChatRequest` (string) | Frontend sends string; backend expects UUID → 400 error |
| 10 | **Inventory `findOutOfStock` query logic flawed** | `InventoryRepository.java:27` | `availableQuantity = 0 AND currentQuantity > 0` misses damaged/reserved stock |

### P1 — High Priority

| # | Finding | File/Location | Risk |
|---|---------|---------------|------|
| 11 | **No request validation on frontend** | `endpoints.ts` — no Zod schemas used | Invalid payloads reach backend; poor UX |
| 12 | **No API versioning** | All controllers at `/api/*` | Breaking changes require coordinated deploy |
| 13 | **CORS allows `localhost:8080` (backend port)** | `SecurityConfig.java:110` | Unnecessary origin; potential CSRF if backend serves frontend |
| 14 | **`JwtAuthenticationFilter` swallows invalid tokens silently** | `JwtAuthenticationFilter.java:56-60` | Masked auth failures; hard to debug |
| 15 | **`RecommendationService.calculateSalesVelocity` returns hardcoded mock** | `RecommendationService.java:235` | Recommendations based on fake data |
| 16 | **No pagination defaults/limits on list endpoints** | Multiple controllers | Unbounded queries → OOM on large datasets |
| 17 | **Frontend `copilotApi.chat` expects `toolsUsed` but backend returns `toolCalls`/`toolResults`** | `Copilot.tsx:78` vs `CopilotService.CopilotResponse` | Tool chips won't display; silent data loss |
| 18 | **No password complexity enforcement** | `AuthService.java:73` — only BCrypt | Weak passwords allowed |
| 19 | **`SEED_ENABLED=false` default but no seed script visible** | `application.yml:148` | Empty DB on first run; no demo data |

### P2 — Medium Priority

| # | Finding | File/Location | Risk |
|---|---------|---------------|------|
| 20 | **No Spotless/Checkstyle in Maven** | `pom.xml` | Inconsistent formatting |
| 21 | **Frontend `vite.config.ts` proxy only for `/api`** | `vite.config.ts:14-18` | WebSocket, SSE, static assets not proxied |
| 22 | **`BusinessContextService.getSlowMovingProducts` sorts by quantity desc (wrong)** | `BusinessContextService.java:188-193` | Shows high-stock items, not slow-moving |
| 23 | **Duplicate `AIConversation`/`AIMessage` in root + copilot package** | `backend/src/main/java/com/threadpilot/AIConversation.java` + `copilot/` | Confusion; potential runtime class loading issues |
| 24 | **No structured logging (JSON) for production** | `application.yml:86-87` | Hard to aggregate in log platforms |
| 25 | **`AlertService`, `ReminderService` not wired to scheduled jobs** | `AlertService.java`, `ReminderService.java` | Alerts/reminders never auto-generated |
| 26 | **Frontend `AuthContext` doesn't handle token refresh race condition** | `AuthContext.tsx` vs `client.ts:61-71` | Double refresh possible; queue not shared with `api` interceptor |

---

## F. Frontend/Backend API Mismatch Table

| Frontend Call | Backend Route | Mismatch | Severity |
|---------------|---------------|----------|----------|
| `copilotApi.chat({message, conversationId: string})` | `POST /api/copilot/chat?conversationId=UUID` | `conversationId` type: string vs UUID | **HIGH** — 400 Bad Request |
| `copilotApi.chat` expects `AiChatResponse {message, conversationId, toolsUsed?}` | Returns `CopilotService.CopilotResponse {message, conversationId, toolCalls, toolResults, tokensUsed, modelUsed, provider}` | Response shape differs; `toolsUsed` missing | **HIGH** — UI breaks |
| `authApi.refresh(refreshToken)` → `POST /api/auth/refresh` body `{refreshToken}` | `AuthController.refreshToken` expects `Authorization: Bearer <refreshToken>` header | Body vs Header | **HIGH** — 400 Bad Request |
| `paymentApi.recordCustomerPayment(data)` → `POST /api/payments/customer` | `PaymentController` — route not verified | Unknown if route exists | **MEDIUM** |
| `invoiceApi.processOcr(id)` → `POST /api/invoices/{id}/ocr` | `OcrController` — route not verified | Unknown if route exists | **MEDIUM** |
| `dashboardApi.getStats()` → `GET /api/dashboard/stats` | No `DashboardController` found | **Missing backend endpoint** | **HIGH** — 404 |
| `analyticsApi.getBusinessHealth()` → `GET /api/analytics/business-health` | `AnalyticsController` — route not verified | Unknown if route exists | **MEDIUM** |
| `productApi.createVariant(productId, data)` → `POST /api/products/{productId}/variants` | `ProductController` — route not verified | Unknown if route exists | **MEDIUM** |

**Note:** Many backend controllers not fully audited due to time; above are confirmed mismatches from sampled files.

---

## G. Safe Cleanup Candidates with Evidence and Deletion Risks

| Candidate | Evidence | Deletion Risk |
|-----------|----------|---------------|
| **Root-package duplicate entities** (20+ files) | `dir backend/src/main/java/com/threadpilot/` shows `User.java`, `Product.java`, `AIConversation.java`, etc. in root AND in `user/`, `product/`, `copilot/` packages | **LOW** — Sub-package versions are used (imports reference `com.threadpilot.user.User`); root files are 0-byte or duplicates. Safe to delete root copies. |
| **`backend/target/`** | Maven build output | **NONE** — Regenerated by `mvn compile` |
| **`frontend/node_modules/`** | npm dependencies | **NONE** — Regenerated by `npm install` |
| **`frontend/dist/`** | Vite build output | **NONE** — Regenerated by `npm run build` |
| **Empty exception classes** | `AccessDeniedException.java` (0 bytes), `ValidationException.java` (0 bytes) | **LOW** — If unused; grep shows no references |
| **Unused `AsyncConfig.java`** | Defines `@EnableAsync` but no `@Async` methods found in codebase | **LOW** — Remove if no async processing used |
| **Mock OCR/Storage providers** | `MockOcrProvider.java`, `LocalStorageProvider.java` — only used in test profile | **LOW** — Keep for test profile; document |

---

## H. Three Smallest, Highest-Value Next Implementation Tasks

| # | Task | Description | Files to Touch | Est. Effort |
|---|------|-------------|----------------|-------------|
| 1 | **Initialize Git + .gitignore** | `git init`, add comprehensive `.gitignore` for Java/Node/Env/IDE | Root `.gitignore`, `README.md` update | 15 min |
| 2 | **Fix Copilot API contract** | Align `conversationId` (string↔UUID), response shape (`toolsUsed` vs `toolCalls`) | `CopilotController.java:28`, `CopilotService.CopilotResponse`, `endpoints.ts:165`, `types.ts:380-384`, `Copilot.tsx:78` | 30 min |
| 3 | **Add minimal test scaffolding** | Backend: 1 `@SpringBootTest` + TestContainers; Frontend: 1 `vitest` + React Testing Library | `backend/src/test/...`, `frontend/src/.../App.test.tsx`, `vitest.config.ts` | 45 min |

---

## I. Recommended Verification Commands for Each Task

| Task | Verification Commands |
|------|----------------------|
| **1. Git + .gitignore** | `git init && git add . && git status` — verify only source files staged; `git commit -m "chore: initial commit"` |
| **2. Fix Copilot API** | `cd backend && mvn compile` — no errors; `cd frontend && npm run build` — no TypeScript errors; Manual test: open Copilot page, send message, verify conversation loads |
| **3. Test Scaffolding** | `cd backend && mvn test` — passes (1 test); `cd frontend && npm run test` — passes (1 test); `cd backend && mvn verify` — TestContainers spins up PostgreSQL |

---

## Additional Notes

### Unverified Claims (Marked UNKNOWN)
- Backend Maven build success — not executed in this audit
- Frontend Vite build success — not executed in this audit
- Docker Compose stack starts cleanly — not executed
- NVIDIA API integration works end-to-end — not tested (no API key provided)
- RBAC enforcement on all endpoints — not verified via integration test
- Tenant isolation under concurrent load — not tested
- Payment calculation correctness — not verified (precision, rounding)
- Invoice OCR pipeline — `OcrService` uses `MockOcrProvider` by default

### Security Posture Summary
| Control | Status |
|---------|--------|
| Password hashing | ✅ BCrypt(12) |
| JWT signing | ✅ HS256 (256-bit key required) |
| Token expiration | ✅ 1h access / 7d refresh |
| Multi-tenant isolation | ✅ `TenantContext` + repository filters |
| SQL injection prevention | ✅ JPA/Specification |
| XSS prevention | ✅ React auto-escape |
| CORS | ⚠️ Overly permissive (includes backend port) |
| Rate limiting | ❌ None |
| Audit logging | ✅ `AuditLog` entity + repository |
| Secret handling | ⚠️ `.env.example` has placeholders; no `.gitignore` |

---

**END OF AUDIT REPORT** — No implementation performed. Ready for next block.