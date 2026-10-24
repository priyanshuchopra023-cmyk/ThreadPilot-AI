import api from './client';
import type {
  User,
  Organization,
  Product,
  ProductVariant,
  Inventory,
  Customer,
  CustomerOrder,
  Sale,
  Payment,
  Supplier,
  SupplierInvoice,
  SupplierInvoiceItem,
  Expense,
  Alert,
  PaginatedResponse,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  UserProfile,
  AiChatRequest,
  AiChatResponse,
  DashboardStats,
  RecentSale,
  RecentOrder,
  LowStockProduct,
  PendingPayment,
  BusinessAlert,
} from '../types';

export const authApi = {
  login: (data: LoginRequest) => api.post<AuthResponse>('/auth/login', data),
  register: (data: RegisterRequest) => api.post<AuthResponse>('/auth/register', data),
  refresh: (refreshToken: string) => api.post<AuthResponse>('/auth/refresh', { refreshToken }),
  logout: () => api.post('/auth/logout'),
  me: () => api.get<UserProfile>('/auth/me'),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post('/auth/change-password', data),
};

export const organizationApi = {
  getCurrent: () => api.get<Organization>('/organizations/current'),
  update: (data: Partial<Organization>) => api.put<Organization>('/organizations/current', data),
};

export const productApi = {
  list: (params?: { page?: number; size?: number; search?: string; category?: string; status?: string }) =>
    api.get<PaginatedResponse<Product>>('/products', { params }),
  get: (id: string) => api.get<Product>(`/products/${id}`),
  create: (data: Partial<Product>) => api.post<Product>('/products', data),
  update: (id: string, data: Partial<Product>) => api.put<Product>(`/products/${id}`, data),
  delete: (id: string) => api.delete(`/products/${id}`),
  getVariants: (productId: string) => api.get<ProductVariant[]>(`/products/${productId}/variants`),
  createVariant: (productId: string, data: Partial<ProductVariant>) =>
    api.post<ProductVariant>(`/products/${productId}/variants`, data),
  updateVariant: (id: string, data: Partial<ProductVariant>) => api.put<ProductVariant>(`/variants/${id}`, data),
  deleteVariant: (id: string) => api.delete(`/variants/${id}`),
};

export const inventoryApi = {
  list: (params?: { page?: number; size?: number; lowStock?: boolean }) =>
    api.get<PaginatedResponse<Inventory>>('/inventory', { params }),
  get: (id: string) => api.get<Inventory>(`/inventory/${id}`),
  getByProduct: (productId: string) => api.get<Inventory>(`/inventory/product/${productId}`),
  getByVariant: (variantId: string) => api.get<Inventory>(`/inventory/variant/${variantId}`),
  adjustStock: (id: string, data: { quantity: number; type: string; notes?: string }) =>
    api.post(`/inventory/${id}/adjust`, data),
  getMovements: (params?: { page?: number; size?: number; productId?: string; variantId?: string }) =>
    api.get<PaginatedResponse<any>>('/inventory/movements', { params }),
};

export const customerApi = {
  list: (params?: { page?: number; size?: number; search?: string; status?: string }) =>
    api.get<PaginatedResponse<Customer>>('/customers', { params }),
  get: (id: string) => api.get<Customer>(`/customers/${id}`),
  create: (data: Partial<Customer>) => api.post<Customer>('/customers', data),
  update: (id: string, data: Partial<Customer>) => api.put<Customer>(`/customers/${id}`, data),
  delete: (id: string) => api.delete(`/customers/${id}`),
  getOutstanding: (id: string) => api.get<{ outstandingAmount: number }>(`/customers/${id}/outstanding`),
  getSalesSummary: (id: string) => api.get<any>(`/customers/${id}/sales-summary`),
};

export const orderApi = {
  list: (params?: { page?: number; size?: number; status?: string; customerId?: string }) =>
    api.get<PaginatedResponse<CustomerOrder>>('/orders', { params }),
  get: (id: string) => api.get<CustomerOrder>(`/orders/${id}`),
  create: (data: Partial<CustomerOrder>) => api.post<CustomerOrder>('/orders', data),
  update: (id: string, data: Partial<CustomerOrder>) => api.put<CustomerOrder>(`/orders/${id}`, data),
  delete: (id: string) => api.delete(`/orders/${id}`),
  confirm: (id: string) => api.post(`/orders/${id}/confirm`),
  fulfill: (id: string, data: { items: Array<{ itemId: string; quantity: number }> }) =>
    api.post(`/orders/${id}/fulfill`, data),
};

export const saleApi = {
  list: (params?: { page?: number; size?: number; startDate?: string; endDate?: string; customerId?: string }) =>
    api.get<PaginatedResponse<Sale>>('/sales', { params }),
  get: (id: string) => api.get<Sale>(`/sales/${id}`),
  create: (data: Partial<Sale>) => api.post<Sale>('/sales', data),
  update: (id: string, data: Partial<Sale>) => api.put<Sale>(`/sales/${id}`, data),
  delete: (id: string) => api.delete(`/sales/${id}`),
};

export const paymentApi = {
  list: (params?: { page?: number; size?: number; type?: string; customerId?: string; supplierId?: string }) =>
    api.get<PaginatedResponse<Payment>>('/payments', { params }),
  get: (id: string) => api.get<Payment>(`/payments/${id}`),
  recordCustomerPayment: (data: { paymentType: string; paymentMethod: string; paymentDate: string; amount: number; referenceNumber?: string; notes?: string; customer: { id: string }; customerOrder?: { id: string } }) =>
    api.post<Payment>('/payments/customer', data),
  recordSupplierPayment: (data: { paymentType: string; paymentMethod: string; paymentDate: string; amount: number; referenceNumber?: string; notes?: string; supplier: { id: string }; supplierInvoice?: { id: string } }) =>
    api.post<Payment>('/payments/supplier', data),
  update: (id: string, data: Partial<Payment>) => api.put<Payment>(`/payments/${id}`, data),
  delete: (id: string) => api.delete(`/payments/${id}`),
  getByCustomer: (customerId: string) => api.get<Payment[]>(`/payments/customer/${customerId}`),
  getBySupplier: (supplierId: string) => api.get<Payment[]>(`/payments/supplier/${supplierId}`),
  getByDateRange: (start: string, end: string) => api.get<Payment[]>(`/payments/date-range`, { params: { start, end } }),
};

export const supplierApi = {
  list: (params?: { page?: number; size?: number; search?: string; status?: string }) =>
    api.get<PaginatedResponse<Supplier>>('/suppliers', { params }),
  get: (id: string) => api.get<Supplier>(`/suppliers/${id}`),
  create: (data: Partial<Supplier>) => api.post<Supplier>('/suppliers', data),
  update: (id: string, data: Partial<Supplier>) => api.put<Supplier>(`/suppliers/${id}`, data),
  delete: (id: string) => api.delete(`/suppliers/${id}`),
  getOutstanding: (id: string) => api.get<{ outstandingAmount: number }>(`/suppliers/${id}/outstanding`),
};

export const invoiceApi = {
  list: (params?: { page?: number; size?: number; status?: string; ocrStatus?: string; supplierId?: string }) =>
    api.get<PaginatedResponse<SupplierInvoice>>('/invoices', { params }),
  get: (id: string) => api.get<SupplierInvoice>(`/invoices/${id}`),
  create: (data: Partial<SupplierInvoice>) => api.post<SupplierInvoice>('/invoices', data),
  update: (id: string, data: Partial<SupplierInvoice>) => api.put<SupplierInvoice>(`/invoices/${id}`, data),
  delete: (id: string) => api.delete(`/invoices/${id}`),
  uploadDocument: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/invoices/${id}/document`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  processOcr: (id: string) => api.post(`/invoices/${id}/ocr`),
  reprocessOcr: (id: string) => api.post(`/invoices/${id}/ocr`),
  getOcrResult: (id: string) => api.get<any>(`/invoices/${id}/ocr-result`),
  verifyOcr: (id: string, data: Partial<SupplierInvoice>) => api.post<SupplierInvoice>(`/invoices/${id}/verify-ocr`, data),
  verify: (id: string) => api.post<SupplierInvoice>(`/invoices/${id}/verify`),
  addItem: (id: string, item: Partial<SupplierInvoiceItem>) => api.post<SupplierInvoice>(`/invoices/${id}/items`, item),
};

export const expenseApi = {
  list: (params?: { page?: number; size?: number; category?: string; startDate?: string; endDate?: string }) =>
    api.get<PaginatedResponse<Expense>>('/expenses', { params }),
  get: (id: string) => api.get<Expense>(`/expenses/${id}`),
  create: (data: Partial<Expense>) => api.post<Expense>('/expenses', data),
  update: (id: string, data: Partial<Expense>) => api.put<Expense>(`/expenses/${id}`, data),
  delete: (id: string) => api.delete(`/expenses/${id}`),
  getSummary: (params?: { startDate?: string; endDate?: string }) =>
    api.get<any>('/expenses/summary', { params }),
};

export const alertApi = {
  list: (params?: { page?: number; size?: number; status?: string; severity?: string }) =>
    api.get<PaginatedResponse<Alert>>('/alerts', { params }),
  get: (id: string) => api.get<Alert>(`/alerts/${id}`),
  markRead: (id: string) => api.post(`/alerts/${id}/read`),
  markResolved: (id: string) => api.post(`/alerts/${id}/resolve`),
  dismiss: (id: string) => api.post(`/alerts/${id}/dismiss`),
  getUnreadCount: () => api.get<{ count: number }>('/alerts/unread-count'),
  markAllRead: () => api.post<{ count: number }>('/alerts/read-all', {}),
};

export const copilotApi = {
  chat: (data: AiChatRequest) => api.post<AiChatResponse>('/copilot/chat', data),
  getConversations: () => api.get<any[]>('/copilot/conversations'),
  getConversation: (id: string) => api.get<any>(`/copilot/conversations/${id}`),
  createConversation: (title?: string) => api.post<any>('/copilot/conversations', { title }),
  deleteConversation: (id: string) => api.delete(`/copilot/conversations/${id}`),
  getProviderInfo: () => api.get<{ name: string; available: boolean; model: string }>('/copilot/provider'),
};

export const dashboardApi = {
  getStats: () => api.get<DashboardStats>('/dashboard/stats'),
  getRecentSales: () => api.get<RecentSale[]>('/dashboard/recent-sales'),
  getRecentOrders: () => api.get<RecentOrder[]>('/dashboard/recent-orders'),
  getLowStock: () => api.get<LowStockProduct[]>('/dashboard/low-stock'),
  getPendingPayments: () => api.get<PendingPayment[]>('/dashboard/pending-payments'),
  getAlerts: () => api.get<BusinessAlert[]>('/dashboard/alerts'),
  list: (params?: { page?: number; size?: number; status?: string; supplierId?: string }) =>
    api.get<any>('/invoices', { params }),
};

export const analyticsApi = {
  getRevenueTrend: (period: 'week' | 'month' | 'quarter' | 'year') =>
    api.get<any[]>(`/analytics/revenue-trend`, { params: { period } }),
  getTopProducts: (limit?: number) => api.get<any[]>(`/analytics/top-products`, { params: { limit } }),
  getTopCustomers: (limit?: number) => api.get<any[]>(`/analytics/top-customers`, { params: { limit } }),
  getSalesByCategory: () => api.get<any[]>(`/analytics/sales-by-category`),
  getBusinessHealth: () => api.get<any>(`/analytics/business-health`),
  getDashboardMetrics: () => api.get<any>(`/analytics/dashboard`),
};