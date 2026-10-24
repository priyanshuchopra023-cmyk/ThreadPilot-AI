# ThreadPilot AI

An AI-powered multi-tenant SaaS platform for business operations management. Built with React, TypeScript, Spring Boot, PostgreSQL, Spring Security/JWT, and NVIDIA AI.

## Features

- **Multi-tenant Architecture** - Organization-based data isolation
- **JWT Authentication** - Secure login/register with access/refresh tokens
- **Role-based Access Control** - 7 system roles with granular permissions
- **Product Management** - Products, variants, categories, pricing
- **Inventory Tracking** - Real-time stock levels, movements, low-stock alerts
- **Customer Management** - Customers, orders, credit limits, payment tracking
- **Sales & Orders** - Sales recording, order fulfillment, invoicing
- **Payment Processing** - Customer/Supplier payments, reconciliation
- **Supplier Management** - Suppliers, purchase orders, invoices
- **Expense Tracking** - Categorized expenses with receipts
- **Business Alerts** - Automated alerts for low stock, overdue payments, etc.
- **AI Copilot** - Natural language business insights via NVIDIA Nemotron
- **Analytics Dashboard** - Revenue trends, top products, business health
- **Audit Logging** - Complete audit trail for compliance

## Tech Stack

### Backend
- **Spring Boot 3.2.5** with Java 21
- **Spring Data JPA / Hibernate** - ORM
- **PostgreSQL** - Primary database
- **Flyway** - Database migrations
- **Spring Security + JWT** - Authentication & Authorization
- **Redis** - Caching (optional)
- **MapStruct** - DTO mapping
- **Lombok** - Boilerplate reduction
- **OpenAPI/Swagger** - API documentation
- **TestContainers** - Integration testing

### Frontend
- **React 18** with TypeScript
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **React Router** - Routing
- **TanStack Query** - Server state management
- **React Hook Form + Zod** - Form validation
- **Lucide React** - Icons
- **Recharts** - Charts
- **React Hot Toast** - Notifications

### AI/ML
- **NVIDIA Nemotron** - Primary LLM provider
- **Mock Provider** - Development/testing
- **Extensible AI Provider Abstraction**

## Prerequisites

- Java 21+
- Node.js 18+
- PostgreSQL 15+
- Redis 7+ (optional)
- Docker & Docker Compose (optional)
- NVIDIA API Key (for AI Copilot)

## Quick Start

### Using Docker Compose (Recommended)

```bash
# Clone the repository
git clone <repository-url>
cd threadpilot-ai

# Set environment variables
cp backend/.env.example backend/.env
# Edit backend/.env with your configuration

# Start all services
docker-compose up -d

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8080
# Swagger UI: http://localhost:8080/swagger-ui.html
```

### Manual Setup

#### Backend

```bash
cd backend

# Configure database
# Update src/main/resources/application.yml or use environment variables

# Run migrations
mvn flyway:migrate

# Build and run
mvn spring-boot:run
```

#### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Configure API URL
echo "VITE_API_URL=http://localhost:8080/api" > .env

# Start development server
npm run dev
```

## Environment Variables

### Backend (`backend/.env`)

```env
# Database
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/threadpilot
SPRING_DATASOURCE_USERNAME=threadpilot
SPRING_DATASOURCE_PASSWORD=threadpilot

# JWT
JWT_SECRET=your-super-secret-key-min-256-bits
JWT_EXPIRATION=86400000
JWT_REFRESH_EXPIRATION=604800000

# NVIDIA AI
NVIDIA_API_KEY=your-nvidia-api-key
NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1
NVIDIA_MODEL=nemotron-3-ultra

# Redis (optional)
SPRING_REDIS_HOST=localhost
SPRING_REDIS_PORT=6379

# Email (optional)
SPRING_MAIL_HOST=smtp.gmail.com
SPRING_MAIL_PORT=587
SPRING_MAIL_USERNAME=your-email
SPRING_MAIL_PASSWORD=your-app-password
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:8080/api
```

## Database Schema

The application uses Flyway for database migrations. Run migrations with:

```bash
# Backend
mvn flyway:migrate

# Or using Docker
docker-compose exec backend mvn flyway:migrate
```

Key tables:
- `organizations` - Tenant organizations
- `users` - System users
- `roles` / `user_roles` - RBAC
- `products` / `product_variants` - Product catalog
- `inventory` / `stock_movements` - Inventory tracking
- `customers` / `customer_orders` - Customer management
- `sales` / `sale_items` - Sales records
- `payments` - Payment transactions
- `suppliers` / `supplier_invoices` - Supplier management
- `expenses` - Expense tracking
- `alerts` / `reminders` - Business notifications
- `ai_conversations` / `ai_messages` - AI chat history
- `audit_logs` - Audit trail
- `business_events` - Event sourcing

## API Documentation

Once the backend is running, access Swagger UI at:
```
http://localhost:8080/swagger-ui.html
```

## AI Copilot

The AI Copilot uses NVIDIA's Nemotron model to provide natural language business insights.

### Example Queries

- "What are my low stock products?"
- "How much did I sell this month?"
- "Which customers have pending payments?"
- "What are my top selling products?"
- "Show my recent sales"
- "Which products are slow moving?"
- "Summarize my business performance"
- "What should I restock?"

### Configuration

Set your NVIDIA API key in the backend environment:

```env
NVIDIA_API_KEY=your-api-key
NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1
NVIDIA_MODEL=nemotron-3-ultra
```

## Project Structure

```
threadpilot-ai/
├── backend/
│   ├── src/main/java/com/threadpilot/
│   │   ├── ai/              # AI providers, copilot, recommendations
│   │   ├── alert/           # Alert management
│   │   ├── analytics/       # Business analytics
│   │   ├── audit/           # Audit logging
│   │   ├── auth/            # Authentication
│   │   ├── common/          # Shared utilities, exceptions, DTOs
│   │   ├── config/          # Configuration classes
│   │   ├── copilot/         # AI conversation handling
│   │   ├── customer/        # Customer management
│   │   ├── event/           # Business events
│   │   ├── expense/         # Expense tracking
│   │   ├── inventory/       # Inventory & stock movements
│   │   ├── invoice/         # Supplier invoices
│   │   ├── ocr/             # OCR processing
│   │   ├── order/           # Customer orders
│   │   ├── organization/    # Multi-tenancy
│   │   ├── payment/         # Payment processing
│   │   ├── product/         # Product catalog
│   │   ├── reminder/        # Reminders
│   │   ├── sale/            # Sales management
│   │   ├── search/          # Search functionality
│   │   ├── security/        # Security config, JWT, TenantContext
│   │   ├── storage/         # File storage abstraction
│   │   ├── supplier/        # Supplier management
│   │   └── user/            # User management
│   ├── src/main/resources/
│   │   ├── db/migration/    # Flyway migrations
│   │   └── application.yml  # Configuration
│   ├── pom.xml
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── api/             # API client & endpoints
│   │   ├── components/
│   │   │   ├── layout/      # Layout components
│   │   │   ├── ui/          # Reusable UI components
│   │   │   ├── forms/       # Form components
│   │   │   ├── tables/      # Data table components
│   │   │   └── dashboard/   # Dashboard widgets
│   │   ├── context/         # React context providers
│   │   ├── hooks/           # Custom React hooks
│   │   ├── pages/           # Page components
│   │   ├── types/           # TypeScript types
│   │   └── utils/           # Utility functions
│   ├── package.json
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   ├── Dockerfile
│   └── nginx.conf
├── docker-compose.yml
└── docs/
    └── IMPLEMENTATION_STATUS.md
```

## Development

### Running Tests

```bash
# Backend
cd backend
mvn test

# Frontend
cd frontend
npm run test
```

### Code Quality

```bash
# Backend
cd backend
mvn spotless:check
mvn spotless:apply

# Frontend
cd frontend
npm run lint
```

### Building for Production

```bash
# Backend
cd backend
mvn clean package -DskipTests

# Frontend
cd frontend
npm run build
```

## Deployment

### Docker Production Build

```bash
# Build images
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build

# Deploy
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Kubernetes (Helm)

Helm charts available in `deploy/helm/` (if implemented).

## Security

- All passwords hashed with BCrypt
- JWT tokens with short expiration + refresh tokens
- Role-based access control on all endpoints
- Multi-tenant data isolation at database level
- CORS configured for frontend origin
- SQL injection prevention via JPA
- XSS protection via React's built-in escaping

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Resume Highlights

> Built ThreadPilot AI, an AI-powered multi-tenant SaaS platform for business operations using React, TypeScript, Spring Boot, PostgreSQL, Spring Security/JWT, and NVIDIA AI. Implemented inventory, sales, customer, supplier, payment and expense management with an AI Copilot for natural-language business insights.

### Key Technical Achievements

- **Full-stack SaaS Architecture** - End-to-end implementation with clean separation of concerns
- **Multi-tenancy** - Organization-based data isolation with TenantContext pattern
- **AI Integration** - NVIDIA Nemotron integration with tool-based function calling
- **Security** - JWT authentication, RBAC, audit logging, SQL injection prevention
- **Database Design** - 25+ normalized tables with Flyway migrations
- **Modern Frontend** - React 18, TypeScript, TanStack Query, Tailwind CSS
- **DevOps** - Docker multi-stage builds, docker-compose, CI/CD ready

## Support

For questions or issues, please open a GitHub issue.