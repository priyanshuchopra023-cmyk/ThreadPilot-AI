import React, { useEffect, useState } from 'react';
import { TrendingUp, ShoppingCart, DollarSign, Package, AlertTriangle, Users, RefreshCw, Bot, CreditCard, Truck, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { DataTable } from '../components/tables/DataTable';
import { dashboardApi, analyticsApi } from '../api/endpoints';
import type { DashboardStats, RecentSale, RecentOrder, LowStockProduct, PendingPayment, BusinessAlert } from '../types';

interface DashboardMetrics {
  todaySales: number;
  monthSales: number;
  prevMonthSales: number;
  monthGrossProfit: number;
  totalReceivables: number;
  totalPayables: number;
  inventoryValue: number;
  lowStockCount: number;
  slowMovingCount: number;
  todaySalesCount: number;
  monthSalesCount: number;
  allTimeSalesCount: number;
}

interface BusinessHealthScore {
  overallScore: number;
  inventoryHealth: number;
  salesHealth: number;
  collectionsHealth: number;
  profitabilityHealth: number;
  slowMovingHealth: number;
}

interface RevenueTrendPoint {
  period: string;
  revenue: number;
}

interface TopProduct {
  productId: string;
  productName: string;
  productSku: string;
  totalQuantity: number;
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
}

interface TopCustomer {
  customerId: string;
  customerName: string;
  totalRevenue: number;
  orderCount: number;
}

const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  subtitle?: string;
  trend?: { value: number; label: string };
  color: string;
  bgColor: string;
}> = ({ title, value, icon, subtitle, trend, color, bgColor }) => (
  <Card className="hover:shadow-md transition-shadow duration-200">
    <CardBody className="p-6">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-secondary-600 truncate">{title}</p>
          <p className="text-3xl font-bold text-secondary-900 mt-1">{value}</p>
          {subtitle && <p className="text-sm text-secondary-500 mt-1">{subtitle}</p>}
          {trend && (
            <div className="flex items-center gap-2 mt-2">
              {trend.value > 0 ? (
                <ArrowUpRight className="w-4 h-4 text-success-600" />
              ) : trend.value < 0 ? (
                <ArrowDownRight className="w-4 h-4 text-danger-600" />
              ) : (
                <Minus className="w-4 h-4 text-secondary-500" />
              )}
              <span className={`text-sm font-medium ${trend.value > 0 ? 'text-success-600' : trend.value < 0 ? 'text-danger-600' : 'text-secondary-500'}`}>
                {trend.value >= 0 ? '+' : ''}{trend.value.toFixed(1)}% {trend.label}
              </span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl ${bgColor} flex-shrink-0`}>
          {icon}
        </div>
      </div>
    </CardBody>
  </Card>
);

const RecentSalesTable: React.FC<{ data: RecentSale[] }> = ({ data }) => (
  <Card>
    <CardHeader className="flex items-center justify-between">
      <h3 className="text-lg font-semibold text-secondary-900">Recent Sales</h3>
      <Button variant="ghost" size="sm" asChild>
        <a href="/sales">View all</a>
      </Button>
    </CardHeader>
    <CardBody className="p-0">
      <DataTable
        data={data}
        columns={[
          { key: 'saleNumber', header: 'Sale #', width: '120px' },
          { key: 'saleDate', header: 'Date', width: '120px' },
          { key: 'customerName', header: 'Customer' },
          { key: 'totalAmount', header: 'Amount', align: 'right', render: (row) => `₹${Number(row.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` },
        ]}
        keyExtractor={(row) => row.id}
        emptyMessage="No recent sales"
      />
    </CardBody>
  </Card>
);

const RecentOrdersTable: React.FC<{ data: RecentOrder[] }> = ({ data }) => (
  <Card>
    <CardHeader className="flex items-center justify-between">
      <h3 className="text-lg font-semibold text-secondary-900">Recent Orders</h3>
      <Button variant="ghost" size="sm" asChild>
        <a href="/orders">View all</a>
      </Button>
    </CardHeader>
    <CardBody className="p-0">
      <DataTable
        data={data}
        columns={[
          { key: 'orderNumber', header: 'Order #', width: '120px' },
          { key: 'orderDate', header: 'Date', width: '120px' },
          { key: 'customerName', header: 'Customer' },
          { key: 'status', header: 'Status', width: '120px', render: (row) => <Badge variant={row.status === 'DELIVERED' ? 'success' : row.status === 'CANCELLED' ? 'danger' : 'warning'}>{row.status}</Badge> },
          { key: 'totalAmount', header: 'Amount', align: 'right', width: '120px', render: (row) => `₹${Number(row.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` },
        ]}
        keyExtractor={(row) => row.id}
        emptyMessage="No recent orders"
      />
    </CardBody>
  </Card>
);

const LowStockTable: React.FC<{ data: LowStockProduct[] }> = ({ data }) => (
  <Card>
    <CardHeader className="flex items-center justify-between">
      <h3 className="text-lg font-semibold text-secondary-900 flex items-center gap-2">
        <AlertTriangle className="w-5 h-5 text-warning-600" />
        Low Stock Items
      </h3>
      <Button variant="ghost" size="sm" asChild>
        <a href="/inventory?lowStock=true">View all</a>
      </Button>
    </CardHeader>
    <CardBody className="p-0">
      <DataTable
        data={data}
        columns={[
          { key: 'sku', header: 'SKU', width: '120px' },
          { key: 'name', header: 'Product' },
          { key: 'availableQuantity', header: 'Available', align: 'center', render: (row) => <span className="font-medium text-danger-600">{row.availableQuantity}</span> },
          { key: 'minStockLevel', header: 'Min Level', align: 'center' },
        ]}
        keyExtractor={(row) => row.id}
        emptyMessage="All items well stocked"
      />
    </CardBody>
  </Card>
);

const AlertsTable: React.FC<{ data: BusinessAlert[] }> = ({ data }) => (
  <Card>
    <CardHeader className="flex items-center justify-between">
      <h3 className="text-lg font-semibold text-secondary-900">Recent Alerts</h3>
      <Button variant="ghost" size="sm" asChild>
        <a href="/alerts">View all</a>
      </Button>
    </CardHeader>
    <CardBody className="p-0">
      <DataTable
        data={data}
        columns={[
          { key: 'alertType', header: 'Type', width: '140px', render: (row) => <Badge variant={row.severity === 'CRITICAL' || row.severity === 'URGENT' ? 'danger' : row.severity === 'WARNING' ? 'warning' : 'info'}>{row.alertType}</Badge> },
          { key: 'title', header: 'Title' },
          { key: 'message', header: 'Message', render: (row) => <span className="max-w-xs truncate block">{row.message}</span> },
          { key: 'createdAt', header: 'Time', width: '160px', render: (row) => new Date(row.createdAt).toLocaleString() },
        ]}
        keyExtractor={(row) => row.id}
        emptyMessage="No alerts"
      />
    </CardBody>
  </Card>
);

const ReceivablesPayablesCard: React.FC = () => {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: async () => {
      const res = await analyticsApi.getDashboardMetrics();
      return res.data as unknown as DashboardMetrics;
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-secondary-900">Receivables & Payables</h3>
        </CardHeader>
        <CardBody className="space-y-4 animate-pulse">
          <div className="h-8 bg-secondary-200 rounded w-1/2" />
          <div className="h-8 bg-secondary-200 rounded w-1/2" />
        </CardBody>
      </Card>
    );
  }

  const receivables = metrics?.totalReceivables ?? 0;
  const payables = metrics?.totalPayables ?? 0;
  const netPosition = receivables - payables;

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold text-secondary-900">Receivables & Payables</h3>
      </CardHeader>
      <CardBody className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-success-50 rounded-lg">
            <p className="text-sm font-medium text-success-800">Customer Receivables</p>
            <p className="text-2xl font-bold text-success-900 mt-1">₹{Number(receivables).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="p-4 bg-danger-50 rounded-lg">
            <p className="text-sm font-medium text-danger-800">Supplier Payables</p>
            <p className="text-2xl font-bold text-danger-900 mt-1">₹{Number(payables).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
        <div className={`p-4 rounded-lg ${netPosition >= 0 ? 'bg-success-50' : 'bg-danger-50'}`}>
          <p className="text-sm font-medium text-secondary-700">Net Position</p>
          <p className={`text-2xl font-bold mt-1 ${netPosition >= 0 ? 'text-success-900' : 'text-danger-900'}`}>
            {netPosition >= 0 ? '+' : ''}₹{Number(netPosition).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </CardBody>
    </Card>
  );
};

const OverdueInvoicesCard: React.FC = () => {
  const { data: invoices, isLoading } = useQuery({
    queryKey: ['overdue-invoices'],
    queryFn: async () => {
      const res = await dashboardApi.list({ status: 'OVERDUE', size: 5 });
      return (res.data as unknown as { content: any[] }).content;
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-secondary-900 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-warning-600" />
            Overdue Invoices
          </h3>
          <Button variant="ghost" size="sm" asChild>
            <a href="/invoices?status=OVERDUE">View all</a>
          </Button>
        </CardHeader>
        <CardBody className="p-0 animate-pulse">
          <div className="h-10 bg-secondary-200 rounded" />
          <div className="h-10 bg-secondary-200 rounded" />
        </CardBody>
      </Card>
    );
  }

  const overdueInvoices = invoices || [];

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-secondary-900 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-warning-600" />
          Overdue Invoices
        </h3>
        <Button variant="ghost" size="sm" asChild>
          <a href="/invoices?status=OVERDUE">View all</a>
        </Button>
      </CardHeader>
      <CardBody className="p-0">
        {overdueInvoices.length === 0 ? (
          <div className="p-6 text-center text-secondary-500">No overdue invoices</div>
        ) : (
          <DataTable
            data={overdueInvoices}
            columns={[
              { key: 'invoiceNumber', header: 'Invoice #', width: '140px' },
              { key: 'dueDate', header: 'Due Date', width: '120px', render: (row) => new Date(row.dueDate).toLocaleDateString() },
              { key: 'supplierId', header: 'Supplier', width: '120px', render: (row) => <span className="font-mono text-xs">{row.supplierId.slice(0, 8)}...</span> },
              { key: 'outstandingAmount', header: 'Outstanding', align: 'right', width: '130px', render: (row) => `₹${Number(row.outstandingAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` },
            ]}
            keyExtractor={(row) => row.id}
            searchable={false}
            sortable={false}
            pagination={{ enabled: false }}
            emptyMessage="No overdue invoices"
          />
        )}
      </CardBody>
    </Card>
  );
};

const UpcomingDueInvoicesCard: React.FC = () => {
  const { data: invoices, isLoading } = useQuery({
    queryKey: ['upcoming-due-invoices'],
    queryFn: async () => {
      const today = new Date();
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      const res = await dashboardApi.list({ 
        status: 'PENDING', 
        size: 5 
      });
      const all = (res.data as unknown as { content: any[] }).content;
      return all.filter(inv => {
        const due = new Date(inv.dueDate);
        return due >= today && due <= nextWeek;
      }).slice(0, 5);
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-secondary-900 flex items-center gap-2">
            <Truck className="w-5 h-5 text-primary-600" />
            Due This Week
          </h3>
          <Button variant="ghost" size="sm" asChild>
            <a href="/invoices?status=PENDING">View all</a>
          </Button>
        </CardHeader>
        <CardBody className="p-0 animate-pulse">
          <div className="h-10 bg-secondary-200 rounded" />
          <div className="h-10 bg-secondary-200 rounded" />
        </CardBody>
      </Card>
    );
  }

  const upcomingInvoices = invoices || [];

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-secondary-900 flex items-center gap-2">
          <Truck className="w-5 h-5 text-primary-600" />
          Due This Week
        </h3>
        <Button variant="ghost" size="sm" asChild>
          <a href="/invoices?status=PENDING">View all</a>
        </Button>
      </CardHeader>
      <CardBody className="p-0">
        {upcomingInvoices.length === 0 ? (
          <div className="p-6 text-center text-secondary-500">No invoices due this week</div>
        ) : (
          <DataTable
            data={upcomingInvoices}
            columns={[
              { key: 'invoiceNumber', header: 'Invoice #', width: '140px' },
              { key: 'dueDate', header: 'Due Date', width: '120px', render: (row) => new Date(row.dueDate).toLocaleDateString() },
              { key: 'supplierId', header: 'Supplier', width: '120px', render: (row) => <span className="font-mono text-xs">{row.supplierId.slice(0, 8)}...</span> },
              { key: 'outstandingAmount', header: 'Amount', align: 'right', width: '130px', render: (row) => `₹${Number(row.outstandingAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` },
            ]}
            keyExtractor={(row) => row.id}
            searchable={false}
            sortable={false}
            pagination={{ enabled: false }}
            emptyMessage="No invoices due this week"
          />
        )}
      </CardBody>
    </Card>
  );
};

const BusinessHealthCard: React.FC = () => {
  const { data: health, isLoading } = useQuery({
    queryKey: ['business-health'],
    queryFn: async () => {
      const res = await analyticsApi.getBusinessHealth();
      return res.data as unknown as BusinessHealthScore;
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-secondary-900">Business Health Score</h3>
        </CardHeader>
        <CardBody className="animate-pulse space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="h-4 bg-secondary-200 rounded w-1/3" />
              <div className="h-4 bg-secondary-200 rounded w-20" />
            </div>
          ))}
        </CardBody>
      </Card>
    );
  }

  if (!health) {
    return (
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-secondary-900">Business Health Score</h3>
        </CardHeader>
        <CardBody className="text-center text-secondary-500 py-8">
          Data unavailable
        </CardBody>
      </Card>
    );
  }

  const metrics = [
    { label: 'Overall', value: health.overallScore, color: 'primary' },
    { label: 'Inventory', value: health.inventoryHealth, color: 'success' },
    { label: 'Sales', value: health.salesHealth, color: 'primary' },
    { label: 'Collections', value: health.collectionsHealth, color: 'warning' },
    { label: 'Profitability', value: health.profitabilityHealth, color: 'danger' },
    { label: 'Slow Moving', value: health.slowMovingHealth, color: 'secondary' },
  ];

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold text-secondary-900">Business Health Score</h3>
      </CardHeader>
      <CardBody className="space-y-3">
        {metrics.map((m) => (
          <div key={m.label} className="flex items-center gap-3">
            <span className="text-sm font-medium text-secondary-700 w-28">{m.label}</span>
            <div className="flex-1 h-2 bg-secondary-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${m.value}%` }}
              >
                <div className={`h-full rounded-full ${m.value >= 70 ? 'bg-success-500' : m.value >= 40 ? 'bg-warning-500' : 'bg-danger-500'}`} />
              </div>
            </div>
            <span className={`text-sm font-bold w-12 text-right ${m.value >= 70 ? 'text-success-600' : m.value >= 40 ? 'text-warning-600' : 'text-danger-600'}`}>
              {m.value}%
            </span>
          </div>
        ))}
      </CardBody>
    </Card>
  );
};

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentSales, setRecentSales] = useState<RecentSale[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [lowStock, setLowStock] = useState<LowStockProduct[]>([]);
  const [alerts, setAlerts] = useState<BusinessAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setError(null);
      const [statsRes, salesRes, ordersRes, stockRes, alertsRes] = await Promise.all([
        dashboardApi.getStats(),
        dashboardApi.getRecentSales(),
        dashboardApi.getRecentOrders(),
        dashboardApi.getLowStock(),
        dashboardApi.getAlerts(),
      ]);

      if (statsRes.data) setStats(statsRes.data);
      if (salesRes.data) setRecentSales(salesRes.data);
      if (ordersRes.data) setRecentOrders(ordersRes.data);
      if (stockRes.data) setLowStock(stockRes.data);
      if (alertsRes.data) setAlerts(alertsRes.data);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}><CardBody className="p-6 h-24"><div className="h-4 bg-secondary-200 rounded w-1/4 mb-2"/><div className="h-8 bg-secondary-200 rounded w-1/2"/></CardBody></Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <Card key={i}><CardBody className="p-6 h-64"><div className="h-4 bg-secondary-200 rounded w-1/4 mb-4"/><div className="space-y-3"><div className="h-10 bg-secondary-200 rounded"/><div className="h-10 bg-secondary-200 rounded"/></div></CardBody></Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <Card key={i + 10}><CardBody className="p-6 h-64"><div className="h-4 bg-secondary-200 rounded w-1/4 mb-4"/><div className="space-y-3"><div className="h-10 bg-secondary-200 rounded"/><div className="h-10 bg-secondary-200 rounded"/></div></CardBody></Card>
          ))}
        </div>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-secondary-900">Dashboard</h1>
            <p className="text-secondary-600 mt-1">Overview of your business performance</p>
          </div>
          <Button variant="secondary" onClick={fetchDashboardData} leftIcon={<RefreshCw className="w-4 h-4" />}>
            Refresh
          </Button>
        </div>
        <Card>
          <CardBody className="p-8 text-center">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-warning-500" />
            <p className="text-lg text-secondary-600 mb-4">{error}</p>
            <Button onClick={fetchDashboardData} leftIcon={<RefreshCw className="w-4 h-4" />}>
              Retry
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  const receivablesTrend = stats && stats.outstandingPayments > 0
    ? { value: 0, label: 'vs last month' }
    : undefined;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Dashboard</h1>
          <p className="text-secondary-600 mt-1">Overview of your business performance</p>
        </div>
        <Button variant="secondary" onClick={fetchDashboardData} leftIcon={<RefreshCw className="w-4 h-4" />}>
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value={stats ? `₹${Number(stats.totalRevenue).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
          icon={<DollarSign className="w-6 h-6 text-primary-600" />}
          subtitle="All-time revenue"
          color="text-primary-600"
          bgColor="bg-primary-100"
        />
        <StatCard
          title="Total Sales"
          value={stats ? stats.totalSales.toLocaleString() : '—'}
          icon={<ShoppingCart className="w-6 h-6 text-success-600" />}
          subtitle="All-time transactions"
          color="text-success-600"
          bgColor="bg-success-100"
        />
        <StatCard
          title="Customer Receivables"
          value={stats ? `₹${Number(stats.outstandingPayments).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
          icon={<Users className="w-6 h-6 text-warning-600" />}
          subtitle="Outstanding from customers"
          color="text-warning-600"
          bgColor="bg-warning-100"
        />
        <StatCard
          title="Inventory Value"
          value={stats ? `₹${Number(stats.inventoryValue).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
          icon={<Package className="w-6 h-6 text-primary-600" />}
          subtitle="Current stock valuation"
          color="text-primary-600"
          bgColor="bg-primary-100"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentSalesTable data={recentSales} />
        <RecentOrdersTable data={recentOrders} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <LowStockTable data={lowStock} />
        <ReceivablesPayablesCard />
        <BusinessHealthCard />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OverdueInvoicesCard />
        <UpcomingDueInvoicesCard />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AlertsTable data={alerts} />
        <Card>
          <CardHeader className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-secondary-900 flex items-center gap-2">
              <Bot className="w-5 h-5 text-primary-600" />
              AI Business Insights
            </h3>
            <Button variant="ghost" size="sm" asChild>
              <a href="/copilot">Ask AI</a>
            </Button>
          </CardHeader>
          <CardBody>
            <div className="bg-primary-50 border border-primary-200 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-primary-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-secondary-900">Ask me about your business</p>
                  <p className="text-sm text-secondary-600 mt-1">
                    Try asking: "What are my low stock products?" or "How much did I sell this month?" or "Which customers have pending payments?"
                  </p>
                  <Button size="sm" asChild className="mt-3">
                    <a href="/copilot">Open AI Copilot →</a>
                  </Button>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;