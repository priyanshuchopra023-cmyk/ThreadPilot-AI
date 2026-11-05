export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'LOCKED' | 'PENDING_VERIFICATION';
  avatarUrl?: string;
  organizationId: string;
  roles: Role[];
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  systemRole: boolean;
}

export interface Organization {
  id: string;
  name: string;
  code: string;
  gstNumber?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  phone?: string;
  email?: string;
  logoUrl?: string;
  settings: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  brand?: string;
  category?: string;
  subcategory?: string;
  size?: string;
  color?: string;
  material?: string;
  gender?: string;
  unit?: string;
  purchasePrice: number;
  sellingPrice: number;
  minStockLevel: number;
  reorderQuantity: number;
  barcode?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED' | 'ARCHIVED';
  description?: string;
  imageUrl?: string;
  organizationId: string;
  supplierId?: string;
  variants: ProductVariant[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariant {
  id: string;
  sku: string;
  size?: string;
  color?: string;
  purchasePrice: number;
  sellingPrice: number;
  minStockLevel: number;
  reorderQuantity: number;
  barcode?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED' | 'ARCHIVED';
  imageUrl?: string;
  productId: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Inventory {
  id: string;
  productId?: string;
  variantId?: string;
  currentQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  incomingQuantity: number;
  damagedQuantity: number;
  returnedQuantity: number;
  averageCost: number;
  totalValue: number;
  lastMovementAt?: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  name: string;
  businessName?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  gstNumber?: string;
  panNumber?: string;
  customerType: 'RETAILER' | 'WHOLESALER' | 'DISTRIBUTOR' | 'EXPORTER' | 'OTHER';
  creditLimit: number;
  outstandingAmount: number;
  paymentTerms?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'BLACKLISTED' | 'ON_HOLD';
  notes?: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerOrder {
  id: string;
  orderNumber: string;
  orderDate: string;
  expectedDeliveryDate?: string;
  actualDeliveryDate?: string;
  status: 'DRAFT' | 'CONFIRMED' | 'IN_PROGRESS' | 'READY_FOR_DISPATCH' | 'DISPATCHED' | 'DELIVERED' | 'CANCELLED' | 'RETURNED';
  paymentStatus: 'PENDING' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE';
  fulfillmentStatus: 'PENDING' | 'PARTIAL' | 'FULFILLED' | 'BACKORDERED';
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  notes?: string;
  shippingAddress?: string;
  customerId: string;
  customerName?: string;
  organizationId: string;
  createdById?: string;
  items: CustomerOrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CustomerOrderItem {
  id: string;
  quantity: number;
  reservedQuantity: number;
  fulfilledQuantity: number;
  unitPrice: number;
  taxRate: number;
  discountRate: number;
  lineTotal: number;
  description?: string;
  orderId: string;
  productId?: string;
  variantId?: string;
  organizationId: string;
}

export interface Sale {
  id: string;
  saleNumber: string;
  saleDate: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  costAmount: number;
  grossProfit: number;
  notes?: string;
  customerId?: string;
  customerName?: string;
  orderId?: string;
  organizationId: string;
  createdById?: string;
  items: SaleItem[];
  createdAt: string;
  updatedAt: string;
}

export interface SaleItem {
  id: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  taxRate: number;
  discountRate: number;
  lineTotal: number;
  costAmount: number;
  description?: string;
  saleId: string;
  productId?: string;
  variantId?: string;
  organizationId: string;
}

export interface Payment {
  id: string;
  paymentNumber: string;
  paymentType: 'CUSTOMER_PAYMENT' | 'SUPPLIER_PAYMENT' | 'REFUND' | 'ADJUSTMENT';
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'UPI' | 'CARD' | 'CHEQUE' | 'ONLINE' | 'OTHER';
  paymentDate: string;
  amount: number;
  referenceNumber?: string;
  notes?: string;
  customerId?: string;
  supplierId?: string;
  supplierInvoiceId?: string;
  customerOrderId?: string;
  organizationId: string;
  recordedById?: string;
  reconciled: boolean;
  reconciledAt?: string;
  reconciledById?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  companyName?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  gstNumber?: string;
  panNumber?: string;
  paymentTerms?: string;
  outstandingAmount: number;
  status: 'ACTIVE' | 'INACTIVE' | 'BLACKLISTED' | 'ON_HOLD';
  notes?: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierInvoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  status: 'DRAFT' | 'PROCESSING' | 'VERIFIED' | 'PAID' | 'PARTIALLY_PAID' | 'OVERDUE' | 'CANCELLED';
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  notes?: string;
  documentUrl?: string;
  ocrStatus: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'VERIFIED';
  ocrConfidence?: number;
  ocrRawData?: string;
  supplierId: string;
  supplierName?: string;
  organizationId: string;
  verifiedById?: string;
  verifiedAt?: string;
  items: SupplierInvoiceItem[];
  createdAt: string;
  updatedAt: string;
}

export interface SupplierInvoiceItem {
  id: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  discountRate: number;
  lineTotal: number;
  description?: string;
  invoiceId: string;
  productId?: string;
  variantId?: string;
  organizationId: string;
}

export interface Expense {
  id: string;
  expenseNumber: string;
  category: 'RENT' | 'UTILITIES' | 'SALARIES' | 'MARKETING' | 'TRAVEL' | 'OFFICE_SUPPLIES' | 'EQUIPMENT' | 'SOFTWARE' | 'INSURANCE' | 'LEGAL' | 'ACCOUNTING' | 'MAINTENANCE' | 'SHIPPING' | 'PACKAGING' | 'OTHER';
  expenseDate: string;
  amount: number;
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'UPI' | 'CARD' | 'CHEQUE' | 'ONLINE' | 'OTHER';
  vendorName?: string;
  referenceNumber?: string;
  description?: string;
  receiptUrl?: string;
  isRecurring: boolean;
  recurringFrequency?: string;
  organizationId: string;
  recordedById?: string;
  approved: boolean;
  approvedById?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Alert {
  id: string;
  alertType: 'LOW_STOCK' | 'OUT_OF_STOCK' | 'OVERDUE_PAYMENT' | 'OVERDUE_INVOICE' | 'HIGH_OUTSTANDING' | 'LOW_MARGIN' | 'SLOW_MOVING' | 'EXPIRING_PRODUCT' | 'CUSTOMER_CREDIT_LIMIT' | 'SUPPLIER_ISSUE' | 'SYSTEM' | 'CUSTOM';
  severity: 'INFO' | 'WARNING' | 'CRITICAL' | 'URGENT';
  status: 'UNREAD' | 'READ' | 'DISMISSED' | 'RESOLVED' | 'SNOOZED';
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
  supportingData?: string;
  actionUrl?: string;
  actionLabel?: string;
  organizationId: string;
  assignedUserId?: string;
  readAt?: string;
  readById?: string;
  dismissedAt?: string;
  dismissedById?: string;
  resolvedAt?: string;
  resolvedById?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  pageNumber: number;
  pageSize: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface LoginRequest {
  email: string;
  password: string;
  organizationCode: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  organizationName: string;
  organizationCode: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: User;
  organization: Organization;
}

export interface UserProfile {
  user: User;
  organization: Organization;
}

export interface AiChatRequest {
  message: string;
  conversationId?: string;
}

export interface AiChatResponse {
  message: string;
  conversationId: string;
  toolCalls?: Array<{ id: string; name: string; parameters: Record<string, unknown> }>;
  toolResults?: Array<{ toolName: string; success: boolean; data: unknown; error?: string }>;
  toolsUsed?: string[];
  tokensUsed?: number;
  modelUsed?: string;
  provider?: string;
}

export interface DashboardStats {
  totalRevenue: number;
  totalSales: number;
  outstandingPayments: number;
  inventoryValue: number;
  lowStockItems: number;
}

export interface RecentSale {
  id: string;
  saleNumber: string;
  saleDate: string;
  totalAmount: number;
  customerName?: string;
}

export interface RecentOrder {
  id: string;
  orderNumber: string;
  orderDate: string;
  totalAmount: number;
  customerName: string;
  status: string;
}

export interface LowStockProduct {
  id: string;
  sku: string;
  name: string;
  availableQuantity: number;
  minStockLevel: number;
}

export interface PendingPayment {
  id: string;
  paymentNumber: string;
  paymentDate: string;
  amount: number;
  customerName?: string;
  supplierName?: string;
}

export interface BusinessAlert {
  id: string;
  alertType: string;
  severity: string;
  title: string;
  message: string;
  createdAt: string;
}

export interface OcrLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  discountRate: number;
  lineTotal: number;
}

export interface OcrResult {
  success: boolean;
  rawText: string;
  confidence: number;
  structuredData: Record<string, unknown>;
  lineItems: OcrLineItem[];
  error?: string;
}

export interface CustomerAgingSummary {
  customerId: string;
  customerName: string;
  outstanding: number;
  creditLimit: number;
  daysOverdue: number;
  earliestDueDate?: string;
}

export interface ReceivablesAging {
  current0To30: number;
  overdue31To60: number;
  overdue61To90: number;
  overdue90Plus: number;
  totalReceivables: number;
  customerSummaries: CustomerAgingSummary[];
}

export interface CustomerIntelligence {
  customerId: string;
  customerName: string;
  businessName?: string;
  totalSales: number;
  outstandingBalance: number;
  creditLimit: number;
  orderCount: number;
  avgOrderIntervalDays?: number;
  daysSinceLastOrder?: number;
  hasAdequateHistory?: boolean;
  cycleInterrupted?: boolean;
  segment: 'CREDIT_LIMIT_BREACHED' | 'HIGH_SALES_POOR_COLLECTION' | 'REACTIVATION_OPPORTUNITY' | 'NEW_ACCOUNT' | 'CHAMPION' | 'REGULAR';
  recommendation: string;
}

export interface ActionItem {
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  category: string;
  title: string;
  reason: string;
  entityType: string;
  entityId: string;
  actionUrl: string;
  financialImpact?: number;
  suggestedDraftMessage?: string;
}

export interface TextileProductIntelligence {
  productId: string;
  sku: string;
  productName: string;
  category?: string;
  currentStock: number;
  unitsSold30Days: number;
  dailyVelocity: number;
  daysOfStock?: number;
  demandTrend: 'OUT_OF_STOCK_DEMAND_LOST' | 'FAST_MOVING_CRITICAL_STOCK' | 'FAST_MOVING_REPLENISH_SOON' | 'SLOW_MOVING_DEADSTOCK' | 'NEW_PRODUCT_COLLECTING_DATA' | 'STEADY_PERFORMER';
  dataQualityStatus: 'RELIABLE' | 'PRELIMINARY_DATA';
  recommendation: string;
  reorderQuantity: number;
}

export interface SearchResultItem {
  type: 'PRODUCT' | 'VARIANT' | 'CUSTOMER' | 'SUPPLIER' | 'ORDER' | 'INVOICE' | 'SALE' | 'PAYMENT';
  id: string;
  title: string;
  subtitle: string;
  url: string;
}

export interface SearchResults {
  products: SearchResultItem[];
  variants: SearchResultItem[];
  customers: SearchResultItem[];
  suppliers: SearchResultItem[];
  orders: SearchResultItem[];
  invoices: SearchResultItem[];
  sales: SearchResultItem[];
  payments: SearchResultItem[];
  total: number;
}