import React, { useState } from 'react';
import { 
  Search, 
  ShoppingCart, 
  Plus, 
  Trash2, 
  Eye, 
  Package, 
  DollarSign, 
  Clock, 
  CheckCircle2 
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Card, CardBody } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { DataTable } from '../components/tables/DataTable';
import { Badge } from '../components/ui/Badge';
import { PageHeader } from '../components/ui/PageHeader';
import { orderApi } from '../api/endpoints';
import type { CustomerOrder, PaginatedResponse } from '../types';
import toast from 'react-hot-toast';

const statusOptions = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'READY_FOR_DISPATCH', label: 'Ready for Dispatch' },
  { value: 'DISPATCHED', label: 'Dispatched' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'RETURNED', label: 'Returned' },
];

const paymentStatusOptions = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'PARTIALLY_PAID', label: 'Partially Paid' },
  { value: 'PAID', label: 'Paid' },
  { value: 'OVERDUE', label: 'Overdue' },
];

const fulfillmentOptions = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'PARTIAL', label: 'Partial' },
  { value: 'FULFILLED', label: 'Fulfilled' },
  { value: 'BACKORDERED', label: 'Backordered' },
];

export const Orders: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showModal, setShowModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState<CustomerOrder | null>(null);

  const { data, isLoading, error } = useQuery<CustomerOrder[]>({
    queryKey: ['orders', page, pageSize, search, statusFilter],
    queryFn: async () => {
      const res = await orderApi.list({ page, size: pageSize, status: statusFilter });
      const pageData = res.data as PaginatedResponse<CustomerOrder> | undefined;
      return pageData?.content || [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => orderApi.delete(id),
    onSuccess: () => {
      toast.success('Order deleted');
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: () => toast.error('Failed to delete order'),
  });

  const confirmMutation = useMutation({
    mutationFn: (id: string) => orderApi.confirm(id),
    onSuccess: () => {
      toast.success('Order confirmed');
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : 'Failed to confirm order');
    },
  });

  const closeModal = () => {
    setShowModal(false);
    setEditingOrder(null);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleConfirm = (id: string) => {
    if (window.confirm('Confirm this order?')) {
      confirmMutation.mutate(id);
    }
  };

  if (isLoading && !data) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-navy-100 rounded w-48" />
        <Card><CardBody className="p-6 h-64"><div className="h-4 bg-navy-100 rounded w-1/4 mb-4"/><div className="space-y-3"><div className="h-10 bg-navy-100 rounded"/><div className="h-10 bg-navy-100 rounded"/></div></CardBody></Card>
      </div>
    );
  }

  const orders = data || [];
  const totalItems = data?.length || 0;
  const pipelineValue = orders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
  const deliveredCount = orders.filter(o => o.status === 'DELIVERED').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Orders"
        subtitle="Wholesale customer orders, production allocations, dispatch, and delivery pipeline"
        breadcrumbs={[
          { label: 'Operations' },
          { label: 'Orders' },
        ]}
        actions={
          <Button 
            onClick={() => { setEditingOrder(null); setShowModal(true); }} 
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            className="shadow-sm"
          >
            Create Order
          </Button>
        }
      />

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white border border-navy-100 rounded-xl shadow-card flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-navy-50 text-navy-700 flex items-center justify-center flex-shrink-0">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-navy-500">Total Orders</p>
            <p className="text-xl font-bold text-navy-900 font-mono tabular-nums">{orders.length}</p>
          </div>
        </div>

        <div className="p-4 bg-white border border-navy-100 rounded-xl shadow-card flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-brass-50 text-brass-700 flex items-center justify-center flex-shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-navy-500">Pipeline Value</p>
            <p className="text-xl font-bold text-navy-900 font-mono tabular-nums">
              ₹{pipelineValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <div className="p-4 bg-white border border-navy-100 rounded-xl shadow-card flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-success-50 text-success-700 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-navy-500">Fulfillment Completed</p>
            <p className="text-xl font-bold text-success-800 font-mono tabular-nums">{deliveredCount} Orders</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <CardBody className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400 w-4 h-4" />
              <Input
                placeholder="Search orders..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-9 bg-navy-50/40"
              />
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                options={[{ value: '', label: 'All Statuses' }, ...statusOptions]}
                placeholder="Filter by status"
                className="w-full sm:w-44"
              />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Table Card */}
      <Card className="overflow-hidden">
        <CardBody className="p-0">
          {error ? (
            <div className="p-8 text-center text-danger-600 font-medium text-sm">Failed to load orders</div>
          ) : (
            <DataTable<CustomerOrder>
              data={orders}
              columns={[
                { 
                  key: 'orderNumber', 
                  header: 'Order #', 
                  width: '130px',
                  render: (row: CustomerOrder) => (
                    <span className="font-mono text-xs font-semibold text-navy-900">
                      {row.orderNumber}
                    </span>
                  )
                },
                { 
                  key: 'orderDate', 
                  header: 'Date', 
                  width: '110px',
                  render: (row: CustomerOrder) => (
                    <span className="text-xs text-navy-600 font-mono">
                      {row.orderDate}
                    </span>
                  )
                },
                { 
                  key: 'customerName', 
                  header: 'Customer',
                  render: (row: CustomerOrder) => (
                    <span className="text-xs font-medium text-navy-900">
                      {row.customerName}
                    </span>
                  )
                },
                { 
                  key: 'status', 
                  header: 'Status', 
                  width: '130px', 
                  render: (row: CustomerOrder) => (
                    <Badge 
                      variant={
                        row.status === 'DELIVERED' ? 'success' :
                        row.status === 'CANCELLED' ? 'danger' :
                        row.status === 'DRAFT' ? 'secondary' : 'warning'
                      }
                      dot
                      size="sm"
                    >
                      {row.status.replace(/_/g, ' ')}
                    </Badge>
                  )
                },
                { 
                  key: 'paymentStatus', 
                  header: 'Payment', 
                  width: '120px', 
                  render: (row: CustomerOrder) => (
                    <Badge 
                      variant={
                        row.paymentStatus === 'PAID' ? 'success' :
                        row.paymentStatus === 'OVERDUE' ? 'danger' :
                        row.paymentStatus === 'PARTIALLY_PAID' ? 'warning' : 'secondary'
                      }
                      size="sm"
                    >
                      {row.paymentStatus.replace(/_/g, ' ')}
                    </Badge>
                  )
                },
                { 
                  key: 'fulfillmentStatus', 
                  header: 'Fulfillment', 
                  width: '120px', 
                  render: (row: CustomerOrder) => (
                    <Badge 
                      variant={
                        row.fulfillmentStatus === 'FULFILLED' ? 'success' :
                        row.fulfillmentStatus === 'BACKORDERED' ? 'danger' :
                        row.fulfillmentStatus === 'PARTIAL' ? 'warning' : 'secondary'
                      }
                      size="sm"
                    >
                      {row.fulfillmentStatus.replace(/_/g, ' ')}
                    </Badge>
                  )
                },
                { 
                  key: 'totalAmount', 
                  header: 'Total', 
                  align: 'right', 
                  width: '130px', 
                  render: (row: CustomerOrder) => (
                    <span className="font-mono text-xs font-bold text-navy-900 tabular-nums">
                      ₹{Number(row.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  ) 
                },
                { 
                  key: 'outstandingAmount', 
                  header: 'Outstanding', 
                  align: 'right', 
                  width: '130px', 
                  render: (row: CustomerOrder) => {
                    const outstanding = Number(row.outstandingAmount || 0);
                    return (
                      <span className={`font-mono text-xs font-bold tabular-nums ${
                        outstanding > 0 ? 'text-danger-700' : 'text-success-700'
                      }`}>
                        ₹{outstanding.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    );
                  }
                },
                { 
                  key: 'actions', 
                  header: '', 
                  width: '120px', 
                  align: 'center',
                  render: (row: CustomerOrder) => (
                    <div className="flex items-center justify-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => { setEditingOrder(row); setShowModal(true); }} 
                        aria-label="Edit order"
                        className="text-navy-600 hover:text-navy-900 p-1.5 h-7 w-7"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                      {row.status === 'DRAFT' && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleConfirm(row.id)} 
                          className="text-navy-700 hover:bg-navy-50 text-xs px-2 py-0.5 h-7 font-semibold" 
                          aria-label="Confirm order"
                        >
                          Confirm
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDelete(row.id)} 
                        aria-label="Delete order" 
                        className="text-danger-600 hover:text-danger-700 hover:bg-danger-50 p-1.5 h-7 w-7"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )
                },
              ]}
              keyExtractor={(row) => row.id}
              searchable={false}
              sortable={true}
              pagination={{
                enabled: true,
                pageSize,
                currentPage: page,
                totalItems,
                onPageChange: (newPage) => setPage(newPage),
              }}
              emptyMessage="No customer orders found"
            />
          )}
        </CardBody>
      </Card>

      {/* View / Edit Modal */}
      <Modal
        isOpen={showModal || !!editingOrder}
        onClose={closeModal}
        title={editingOrder ? `Order Details: ${editingOrder.orderNumber}` : 'Create Order'}
        size="lg"
      >
        {editingOrder ? (
          <div className="space-y-4 max-h-[72vh] overflow-y-auto px-1 py-1">
            <div className="grid grid-cols-3 gap-3 p-3.5 bg-navy-50/70 border border-navy-100 rounded-xl">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-navy-500">Order ID</p>
                <p className="font-mono text-xs font-bold text-navy-900 mt-0.5">{editingOrder.orderNumber}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-navy-500">Customer</p>
                <p className="text-xs font-semibold text-navy-900 mt-0.5 truncate">{editingOrder.customerName || editingOrder.customerId}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-navy-500">Created Date</p>
                <p className="font-mono text-xs text-navy-700 mt-0.5">{new Date(editingOrder.orderDate).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <Select
                label="Lifecycle Status"
                value={editingOrder.status}
                onChange={(e) => setEditingOrder({ ...editingOrder, status: e.target.value as typeof editingOrder.status })}
                options={statusOptions}
              />
              <Select
                label="Payment Status"
                value={editingOrder.paymentStatus}
                onChange={(e) => setEditingOrder({ ...editingOrder, paymentStatus: e.target.value as typeof editingOrder.paymentStatus })}
                options={paymentStatusOptions}
              />
              <Select
                label="Fulfillment Status"
                value={editingOrder.fulfillmentStatus}
                onChange={(e) => setEditingOrder({ ...editingOrder, fulfillmentStatus: e.target.value as typeof editingOrder.fulfillmentStatus })}
                options={fulfillmentOptions}
              />
            </div>

            <div className="p-3.5 bg-white border border-navy-100 rounded-xl space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-navy-500 mb-2">Financial Breakdown</h4>
              <div className="grid grid-cols-3 gap-3">
                <Input label="Subtotal (₹)" type="number" step="0.01" value={editingOrder.subtotal} disabled />
                <Input label="Tax (₹)" type="number" step="0.01" value={editingOrder.taxAmount} disabled />
                <Input label="Discount (₹)" type="number" step="0.01" value={editingOrder.discountAmount} disabled />
              </div>
              <div className="grid grid-cols-3 gap-3 pt-2">
                <Input label="Total Net (₹)" type="number" step="0.01" value={editingOrder.totalAmount} disabled className="font-bold text-navy-900" />
                <Input label="Settled (₹)" type="number" step="0.01" value={editingOrder.paidAmount} disabled className="text-success-700" />
                <Input label="Balance (₹)" type="number" step="0.01" value={editingOrder.outstandingAmount} disabled className="text-danger-700 font-bold" />
              </div>
            </div>

            {editingOrder.notes && (
              <div className="p-3 bg-navy-50/50 rounded-lg border border-navy-100">
                <p className="text-xs font-semibold text-navy-600 uppercase tracking-wider">Order Instructions</p>
                <p className="text-xs text-navy-800 mt-1">{editingOrder.notes}</p>
              </div>
            )}

            <div className="flex justify-end gap-2.5 pt-4 border-t border-navy-100">
              <Button type="button" variant="secondary" onClick={closeModal}>
                Close
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center text-navy-600">
            <Package className="w-10 h-10 mx-auto mb-3 text-navy-300" />
            <p className="text-sm font-semibold text-navy-900">New Wholesale Order Pipeline</p>
            <p className="text-xs text-navy-500 mt-1 max-w-sm mx-auto">
              Select verified customer accounts and allocate SKU line items with custom lot discounts.
            </p>
            <div className="mt-5 flex justify-center">
              <Button variant="secondary" onClick={closeModal}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Orders;
