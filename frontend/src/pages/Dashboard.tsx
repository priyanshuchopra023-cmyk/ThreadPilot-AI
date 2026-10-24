import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  ShoppingCart, 
  DollarSign, 
  Package, 
  AlertTriangle, 
  Users, 
  RefreshCw, 
  Bot, 
  Truck, 
  ArrowUpRight, 
  ArrowDownRight, 
  Minus,
  Sparkles,
  Plus,
  ArrowRight,
  ShieldCheck,
  FileText
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { DataTable } from '../components/tables/DataTable';
import { dashboardApi, analyticsApi } from '../api/endpoints';
import type { DashboardStats, RecentSale, RecentOrder, LowStockProduct, BusinessAlert } from '../types';

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

const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  subtitle?: string;
  trend?: { value: number; label: string };
  badgeText?: string;
}> = ({ title, value, icon, subtitle, trend, badgeText }) => (
  <Card className="hover:shadow-card-hover transition-all duration-200 border-navy-100 hover:border-navy-200">
    <CardBody className="p-5">
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1 pr-3">
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-navy-500">{title}</p>
            {badgeText && (
              <Badge variant="brass" size="sm" className="font-mono text-[10px] px-1.5 py-0.5">
                {badgeText}
              </Badge>
            )}
          </div>
          <p className="text-2xl lg:text-3xl font-bold text-navy-900 mt-2 font-mono tabular-nums tracking-tight">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-navy-500 mt-1 flex items-center gap-1">
              {subtitle}
            </p>
          )}
          {trend && (
            <div className="flex items-center gap-1.5 mt-2.5">
              <span className={`inline-flex items-center text-xs font-semibold px-1.5 py-0.5 rounded ${
                trend.value > 0 ? 'bg-success-50 text-success-700' : trend.value < 0 ? 'bg-danger-50 text-danger-700' : 'bg-navy-50 text-navy-600'
              }`}>
                {trend.value > 0 ? (
                  <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
                ) : trend.value < 0 ? (
                  <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
                ) : (
                  <Minus className="w-3.5 h-3.5 mr-0.5" />
                )}
                {trend.value >= 0 ? '+' : ''}{trend.value.toFixed(1)}%
              </span>
              <span className="text-xs text-navy-400">{trend.label}</span>
            </div>
          )}
        </div>
        <div className="w-11 h-11 rounded-xl bg-navy-50 border border-navy-100/80 flex items-center justify-center flex-shrink-0 text-navy-700 shadow-sm">
          {icon}
        </div>
      </div>
    </CardBody>
  </Card>
);

const RecentSalesTable: React.FC<{ data: RecentSale[] }> = ({ data }) => (
  <Card className="h-full flex flex-col">
    <CardHeader 
      title="Recent Sales" 
      description="Latest confirmed revenue transactions"
      action={
        <Button variant="ghost" size="sm" asChild className="text-navy-700 hover:text-navy-900">
          <a href="/sales" className="flex items-center gap-1 text-xs font-semibold">
            View all <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </Button>
      }
    />
    <CardBody className="p-0 flex-1">
      <DataTable
        data={data}
        columns={[
          { key: 'saleNumber', header: 'Sale #', width: '130px', render: (row) => <span className="font-mono text-xs font-semibold text-navy-900">{row.saleNumber}</span> },
          { key: 'saleDate', header: 'Date', width: '110px', render: (row) => <span className="text-xs text-navy-600">{row.saleDate}</span> },
          { key: 'customerName', header: 'Customer', render: (row) => <span className="text-xs font-medium text-navy-800">{row.customerName}</span> },
          { 
            key: 'totalAmount', 
            header: 'Amount', 
            align: 'right', 
            render: (row) => (
              <span className="font-mono text-xs font-bold text-navy-900 tabular-nums">
                ₹{Number(row.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            ) 
          },
        ]}
        keyExtractor={(row) => row.id}
        emptyMessage="No recent sales found"
        searchable={false}
        pagination={{ enabled: false }}
      />
    </CardBody>
  </Card>
);

const RecentOrdersTable: React.FC<{ data: RecentOrder[] }> = ({ data }) => (
  <Card className="h-full flex flex-col">
    <CardHeader 
      title="Recent Orders" 
      description="Active wholesale order pipeline"
      action={
        <Button variant="ghost" size="sm" asChild className="text-navy-700 hover:text-navy-900">
          <a href="/orders" className="flex items-center gap-1 text-xs font-semibold">
            View all <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </Button>
      }
    />
    <CardBody className="p-0 flex-1">
      <DataTable
        data={data}
        columns={[
          { key: 'orderNumber', header: 'Order #', width: '130px', render: (row) => <span className="font-mono text-xs font-semibold text-navy-900">{row.orderNumber}</span> },
          { key: 'orderDate', header: 'Date', width: '110px', render: (row) => <span className="text-xs text-navy-600">{row.orderDate}</span> },
          { key: 'customerName', header: 'Customer', render: (row) => <span className="text-xs font-medium text-navy-800">{row.customerName}</span> },
          { 
            key: 'status', 
            header: 'Status', 
            width: '120px', 
            render: (row) => (
              <Badge 
                variant={row.status === 'DELIVERED' ? 'success' : row.status === 'CANCELLED' ? 'danger' : 'warning'} 
                dot
                size="sm"
              >
                {row.status}
              </Badge>
            ) 
          },
          { 
            key: 'totalAmount', 
            header: 'Amount', 
            align: 'right', 
            width: '130px', 
            render: (row) => (
              <span className="font-mono text-xs font-bold text-navy-900 tabular-nums">
                ₹{Number(row.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            ) 
          },
        ]}
        keyExtractor={(row) => row.id}
        emptyMessage="No recent orders found"
        searchable={false}
        pagination={{ enabled: false }}
      />
    </CardBody>
  </Card>
);

const LowStockTable: React.FC<{ data: LowStockProduct[] }> = ({ data }) => (
  <Card className="h-full flex flex-col">
    <CardHeader 
      title={
        <span className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-warning-500" />
          Low Stock Items
        </span>
      }
      description="Stock quantities below minimum threshold"
      action={
        <Button variant="ghost" size="sm" asChild className="text-navy-700 hover:text-navy-900">
          <a href="/inventory?lowStock=true" className="flex items-center gap-1 text-xs font-semibold">
            View all <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </Button>
      }
    />
    <CardBody className="p-0 flex-1">
      <DataTable
        data={data}
        columns={[
          { key: 'sku', header: 'SKU', width: '120px', render: (row) => <span className="font-mono text-xs font-semibold text-navy-900">{row.sku}</span> },
          { key: 'name', header: 'Product', render: (row) => <span className="text-xs font-medium text-navy-800">{row.name}</span> },
          { 
            key: 'availableQuantity', 
            header: 'Available', 
            align: 'center', 
            render: (row) => (
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-danger-50 text-danger-700">
                {row.availableQuantity}
              </span>
            ) 
          },
          { key: 'minStockLevel', header: 'Min Level', align: 'center', render: (row) => <span className="font-mono text-xs text-navy-500">{row.minStockLevel}</span> },
        ]}
        keyExtractor={(row) => row.id}
        emptyMessage="All items are well stocked"
        searchable={false}
        pagination={{ enabled: false }}
      />
    </CardBody>
  </Card>
);

const AlertsTable: React.FC<{ data: BusinessAlert[] }> = ({ data }) => (
  <Card className="h-full flex flex-col">
    <CardHeader 
      title="Recent System Alerts" 
      description="Operational and inventory warnings"
      action={
        <Button variant="ghost" size="sm" asChild className="text-navy-700 hover:text-navy-900">
          <a href="/alerts" className="flex items-center gap-1 text-xs font-semibold">
            View all <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </Button>
      }
    />
    <CardBody className="p-0 flex-1">
      <DataTable
        data={data}
        columns={[
          { 
            key: 'alertType', 
            header: 'Type', 
            width: '130px', 
            render: (row) => (
              <Badge 
                variant={row.severity === 'CRITICAL' || row.severity === 'URGENT' ? 'danger' : row.severity === 'WARNING' ? 'warning' : 'info'}
                size="sm"
              >
                {row.alertType}
              </Badge>
            ) 
          },
          { key: 'title', header: 'Title', render: (row) => <span className="text-xs font-semibold text-navy-900">{row.title}</span> },
          { key: 'message', header: 'Message', render: (row) => <span className="text-xs text-navy-600 max-w-xs truncate block">{row.message}</span> },
          { key: 'createdAt', header: 'Time', width: '140px', render: (row) => <span className="font-mono text-xs text-navy-500">{new Date(row.createdAt).toLocaleDateString()}</span> },
        ]}
        keyExtractor={(row) => row.id}
        emptyMessage="No unread alerts"
        searchable={false}
        pagination={{ enabled: false }}
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
        <CardHeader title="Receivables & Payables" description="Working capital ledger position" />
        <CardBody className="space-y-4 animate-pulse">
          <div className="h-14 bg-navy-50 rounded-xl" />
          <div className="h-14 bg-navy-50 rounded-xl" />
        </CardBody>
      </Card>
    );
  }

  const receivables = metrics?.totalReceivables ?? 0;
  const payables = metrics?.totalPayables ?? 0;
  const netPosition = receivables - payables;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader title="Working Capital Position" description="Customer receivables vs supplier obligations" />
      <CardBody className="space-y-4 flex-1 flex flex-col justify-between">
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3.5 bg-success-50/60 border border-success-100 rounded-xl">
            <p className="text-xs font-semibold text-success-800 uppercase tracking-wider">Receivables</p>
            <p className="text-lg lg:text-xl font-bold text-success-900 mt-1 font-mono tabular-nums">
              ₹{Number(receivables).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] text-success-700 mt-0.5">Owed by customers</p>
          </div>
          <div className="p-3.5 bg-danger-50/60 border border-danger-100 rounded-xl">
            <p className="text-xs font-semibold text-danger-800 uppercase tracking-wider">Payables</p>
            <p className="text-lg lg:text-xl font-bold text-danger-900 mt-1 font-mono tabular-nums">
              ₹{Number(payables).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] text-danger-700 mt-0.5">Owed to suppliers</p>
          </div>
        </div>

        <div className={`p-4 rounded-xl border ${netPosition >= 0 ? 'bg-navy-50/70 border-navy-100' : 'bg-danger-50/70 border-danger-100'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-navy-600">Net Ledger Balance</p>
              <p className={`text-xl font-bold mt-1 font-mono tabular-nums ${netPosition >= 0 ? 'text-navy-900' : 'text-danger-800'}`}>
                {netPosition >= 0 ? '+' : ''}₹{Number(netPosition).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <Badge variant={netPosition >= 0 ? 'success' : 'danger'} size="sm" dot>
              {netPosition >= 0 ? 'Surplus' : 'Deficit'}
            </Badge>
          </div>
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
        <CardHeader title="Overdue Invoices" description="Supplier invoices requiring immediate payment" />
        <CardBody className="p-4 animate-pulse space-y-2">
          <div className="h-9 bg-navy-50 rounded" />
          <div className="h-9 bg-navy-50 rounded" />
        </CardBody>
      </Card>
    );
  }

  const overdueInvoices = invoices || [];

  return (
    <Card className="h-full flex flex-col">
      <CardHeader 
        title={
          <span className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-danger-500" />
            Overdue Invoices
          </span>
        }
        description="Supplier invoices past due date"
        action={
          <Button variant="ghost" size="sm" asChild className="text-navy-700 hover:text-navy-900">
            <a href="/invoices?status=OVERDUE" className="flex items-center gap-1 text-xs font-semibold">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </Button>
        }
      />
      <CardBody className="p-0 flex-1">
        {overdueInvoices.length === 0 ? (
          <div className="p-8 text-center text-navy-400 text-sm">No overdue supplier invoices</div>
        ) : (
          <DataTable
            data={overdueInvoices}
            columns={[
              { key: 'invoiceNumber', header: 'Invoice #', width: '140px', render: (row) => <span className="font-mono text-xs font-semibold text-navy-900">{row.invoiceNumber}</span> },
              { key: 'dueDate', header: 'Due Date', width: '120px', render: (row) => <span className="font-mono text-xs text-danger-600 font-semibold">{new Date(row.dueDate).toLocaleDateString()}</span> },
              { key: 'supplierId', header: 'Supplier', width: '120px', render: (row) => <span className="font-mono text-xs text-navy-500">{row.supplierId.slice(0, 8)}...</span> },
              { key: 'outstandingAmount', header: 'Outstanding', align: 'right', width: '130px', render: (row) => <span className="font-mono text-xs font-bold text-danger-700 tabular-nums">₹{Number(row.outstandingAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span> },
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
        <CardHeader title="Due This Week" description="Upcoming supplier liabilities" />
        <CardBody className="p-4 animate-pulse space-y-2">
          <div className="h-9 bg-navy-50 rounded" />
          <div className="h-9 bg-navy-50 rounded" />
        </CardBody>
      </Card>
    );
  }

  const upcomingInvoices = invoices || [];

  return (
    <Card className="h-full flex flex-col">
      <CardHeader 
        title={
          <span className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-blue-500" />
            Due This Week
          </span>
        }
        description="Supplier liabilities maturing within 7 days"
        action={
          <Button variant="ghost" size="sm" asChild className="text-navy-700 hover:text-navy-900">
            <a href="/invoices?status=PENDING" className="flex items-center gap-1 text-xs font-semibold">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </Button>
        }
      />
      <CardBody className="p-0 flex-1">
        {upcomingInvoices.length === 0 ? (
          <div className="p-8 text-center text-navy-400 text-sm">No invoices maturing this week</div>
        ) : (
          <DataTable
            data={upcomingInvoices}
            columns={[
              { key: 'invoiceNumber', header: 'Invoice #', width: '140px', render: (row) => <span className="font-mono text-xs font-semibold text-navy-900">{row.invoiceNumber}</span> },
              { key: 'dueDate', header: 'Due Date', width: '120px', render: (row) => <span className="font-mono text-xs text-navy-600">{new Date(row.dueDate).toLocaleDateString()}</span> },
              { key: 'supplierId', header: 'Supplier', width: '120px', render: (row) => <span className="font-mono text-xs text-navy-500">{row.supplierId.slice(0, 8)}...</span> },
              { key: 'outstandingAmount', header: 'Amount', align: 'right', width: '130px', render: (row) => <span className="font-mono text-xs font-bold text-navy-900 tabular-nums">₹{Number(row.outstandingAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span> },
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
        <CardHeader title="Business Health Score" description="Multi-dimensional operations index" />
        <CardBody className="animate-pulse space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="h-4 bg-navy-50 rounded w-1/3" />
              <div className="h-4 bg-navy-50 rounded w-16" />
            </div>
          ))}
        </CardBody>
      </Card>
    );
  }

  if (!health) {
    return (
      <Card>
        <CardHeader title="Business Health Score" description="Multi-dimensional operations index" />
        <CardBody className="text-center text-navy-400 py-8 text-sm">
          Analytics baseline calculating...
        </CardBody>
      </Card>
    );
  }

  const metrics = [
    { label: 'Overall Index', value: health.overallScore },
    { label: 'Inventory Turnover', value: health.inventoryHealth },
    { label: 'Sales Velocity', value: health.salesHealth },
    { label: 'Collections Rate', value: health.collectionsHealth },
    { label: 'Profit Margin', value: health.profitabilityHealth },
    { label: 'Aging Stock', value: health.slowMovingHealth },
  ];

  return (
    <Card className="h-full flex flex-col">
      <CardHeader 
        title="Business Health Score" 
        description="Comprehensive real-time performance score" 
        action={
          <Badge variant={health.overallScore >= 70 ? 'success' : health.overallScore >= 40 ? 'warning' : 'danger'} size="sm">
            {health.overallScore}% Overall
          </Badge>
        }
      />
      <CardBody className="space-y-3.5 flex-1 flex flex-col justify-between">
        {metrics.map((m) => (
          <div key={m.label} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-navy-700">{m.label}</span>
              <span className={`font-mono font-bold tabular-nums ${
                m.value >= 70 ? 'text-success-600' : m.value >= 40 ? 'text-warning-600' : 'text-danger-600'
              }`}>
                {m.value}%
              </span>
            </div>
            <div className="h-1.5 w-full bg-navy-100/70 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  m.value >= 70 ? 'bg-success-500' : m.value >= 40 ? 'bg-warning-500' : 'bg-danger-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(0, m.value))}%` }}
              />
            </div>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}><CardBody className="p-5 h-28"><div className="h-4 bg-navy-100 rounded w-1/3 mb-3"/><div className="h-8 bg-navy-100 rounded w-1/2"/></CardBody></Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <Card key={i}><CardBody className="p-6 h-64"><div className="h-4 bg-navy-100 rounded w-1/4 mb-4"/><div className="space-y-3"><div className="h-10 bg-navy-100 rounded"/><div className="h-10 bg-navy-100 rounded"/></div></CardBody></Card>
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
            <h1 className="text-2xl font-bold text-navy-900 tracking-tight">Dashboard</h1>
            <p className="text-sm text-navy-500 mt-1">Enterprise operating system overview</p>
          </div>
          <Button variant="secondary" onClick={fetchDashboardData} leftIcon={<RefreshCw className="w-4 h-4" />}>
            Refresh
          </Button>
        </div>
        <Card className="border-danger-200 bg-danger-50/20">
          <CardBody className="p-12 text-center">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-warning-500" />
            <p className="text-base font-semibold text-navy-900 mb-2">{error}</p>
            <p className="text-xs text-navy-500 mb-6">Could not establish contact with backend analytics services.</p>
            <Button onClick={fetchDashboardData} leftIcon={<RefreshCw className="w-4 h-4" />}>
              Retry Connection
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-navy-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="brass" size="sm" dot>Enterprise Active</Badge>
            <span className="text-xs text-navy-400">•</span>
            <span className="text-xs text-navy-500 font-mono">Live Telemetry</span>
          </div>
          <h1 className="text-2xl font-bold text-navy-900 tracking-tight">Dashboard</h1>
          <p className="text-xs text-navy-500 mt-0.5">Real-time overview of manufacturing, orders, revenue, and inventory flow</p>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={fetchDashboardData} 
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Sync Data
          </Button>
          <Button 
            variant="primary" 
            size="sm" 
            asChild
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            <a href="/orders">New Order</a>
          </Button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={stats ? `₹${Number(stats.totalRevenue).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
          icon={<DollarSign className="w-5 h-5 text-brass-600" />}
          subtitle="Lifetime recognized receipts"
          badgeText="LIFETIME"
        />
        <StatCard
          title="Sales Completed"
          value={stats ? stats.totalSales.toLocaleString() : '—'}
          icon={<ShoppingCart className="w-5 h-5 text-navy-700" />}
          subtitle="Fulfilled transactions"
          badgeText="ORDERS"
        />
        <StatCard
          title="Customer Receivables"
          value={stats ? `₹${Number(stats.outstandingPayments).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
          icon={<Users className="w-5 h-5 text-warning-600" />}
          subtitle="Uncollected invoice balances"
          badgeText="OUTSTANDING"
        />
        <StatCard
          title="Inventory Valuation"
          value={stats ? `₹${Number(stats.inventoryValue).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
          icon={<Package className="w-5 h-5 text-blue-600" />}
          subtitle="Current finished goods at cost"
          badgeText="ASSETS"
        />
      </div>

      {/* Operational Highlights & Insights Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {/* Quick AI Advisor & Action Bar */}
          <div className="bg-gradient-to-r from-navy-900 to-navy-800 text-white rounded-xl p-5 shadow-sm border border-navy-700/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-navy-800 border border-brass-400/30 flex items-center justify-center flex-shrink-0 text-brass-400 shadow-inner">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-white">ThreadPilot Copilot</h3>
                  <Badge variant="brass" size="sm" className="bg-brass-400/20 text-brass-300 border-brass-400/30">
                    AI Enabled
                  </Badge>
                </div>
                <p className="text-xs text-navy-200 mt-0.5 max-w-xl">
                  Ask natural language questions about your yarn allocation, order margins, low stock alerts, or credit limits.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button 
                variant="brass" 
                size="sm" 
                asChild
                className="whitespace-nowrap shadow-brass text-xs font-semibold"
              >
                <a href="/copilot" className="flex items-center gap-1.5">
                  <Bot className="w-3.5 h-3.5" />
                  Launch Copilot
                </a>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <RecentSalesTable data={recentSales} />
            <RecentOrdersTable data={recentOrders} />
          </div>
        </div>

        {/* Business Health Score */}
        <div className="lg:col-span-1">
          <BusinessHealthCard />
        </div>
      </div>

      {/* Working Capital & Stock Alert Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <LowStockTable data={lowStock} />
        <ReceivablesPayablesCard />
        <AlertsTable data={alerts} />
      </div>

      {/* Invoices Risk Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OverdueInvoicesCard />
        <UpcomingDueInvoicesCard />
      </div>
    </div>
  );
};

export default Dashboard;
