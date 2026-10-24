import React, { useState } from 'react';
import { Search, Filter, ShoppingCart, Plus, Edit, Trash2, Eye, ChevronDown, Package } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { DataTable } from '../components/tables/DataTable';
import { Badge } from '../components/ui/Badge';
import { orderApi } from '../api/endpoints';
import type { CustomerOrder, PaginatedResponse, Customer } from '../types';
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
  const [viewingOrder, setViewingOrder] = useState<CustomerOrder | null>(null);

  const { data, isLoading, error } = useQuery<CustomerOrder[]>({
    queryKey: ['orders', page, pageSize, search, statusFilter],
    queryFn: async () => {
      const res = await orderApi.list({ page, size: pageSize, status: statusFilter });
      const pageData = res.data as PaginatedResponse<CustomerOrder> | undefined;
      return pageData?.content || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<CustomerOrder>) => orderApi.create(data),
    onSuccess: () => {
      toast.success('Order created successfully');
      closeModal();
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Failed to create order');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CustomerOrder> }) => orderApi.update(id, data),
    onSuccess: () => {
      toast.success('Order updated successfully');
      closeModal();
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Failed to update order');
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
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Failed to confirm order');
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
        <div className="flex items-center justify-between">
          <div className="h-8 bg-secondary-200 rounded w-48" />
          <div className="h-10 bg-secondary-200 rounded w-32" />
        </div>
        <Card><CardBody className="p-6 h-64"><div className="h-4 bg-secondary-200 rounded w-1/4 mb-4"/><div className="space-y-3"><div className="h-10 bg-secondary-200 rounded"/><div className="h-10 bg-secondary-200 rounded"/></div></CardBody></Card>
      </div>
    );
  }

  const orders = data || [];
  const totalItems = data?.length || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-primary-600" />
            Orders
          </h1>
          <p className="text-secondary-600 mt-1">Manage customer orders</p>
        </div>
        <Button onClick={() => { setEditingOrder(null); setShowModal(true); }} leftIcon={<Plus className="w-4 h-4" />}>
          Create Order
        </Button>
      </div>

      <Card>
        <CardBody className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400 w-5 h-5" />
              <Input
                placeholder="Search orders..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-10"
              />
            </div>
            <Select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              options={[{ value: '', label: 'All Statuses' }, ...statusOptions]}
              placeholder="Filter by status"
              className="w-full sm:w-48"
            />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="p-0">
          {error ? (
            <div className="p-6 text-center text-red-600">Failed to load orders</div>
          ) : (
            <DataTable<CustomerOrder>
              data={orders}
              columns={[
                { key: 'orderNumber', header: 'Order #', width: '130px' },
                { key: 'orderDate', header: 'Date', width: '110px' },
                { key: 'customerName', header: 'Customer' },
                { key: 'status', header: 'Status', width: '140px', render: (row: CustomerOrder) => (
                  <Badge variant={
                    row.status === 'DELIVERED' ? 'success' :
                    row.status === 'CANCELLED' ? 'danger' :
                    row.status === 'DRAFT' ? 'secondary' : 'warning'
                  }>
                    {row.status.replace(/_/g, ' ')}
                  </Badge>
                )},
                { key: 'paymentStatus', header: 'Payment', width: '130px', render: (row) => (
                  <Badge variant={
                    row.paymentStatus === 'PAID' ? 'success' :
                    row.paymentStatus === 'OVERDUE' ? 'danger' :
                    row.paymentStatus === 'PARTIALLY_PAID' ? 'warning' : 'secondary'
                  }>
                    {row.paymentStatus.replace(/_/g, ' ')}
                  </Badge>
                )},
                { key: 'fulfillmentStatus', header: 'Fulfillment', width: '130px', render: (row) => (
                  <Badge variant={
                    row.fulfillmentStatus === 'FULFILLED' ? 'success' :
                    row.fulfillmentStatus === 'BACKORDERED' ? 'danger' :
                    row.fulfillmentStatus === 'PARTIAL' ? 'warning' : 'secondary'
                  }>
                    {row.fulfillmentStatus.replace(/_/g, ' ')}
                  </Badge>
                )},
                { key: 'totalAmount', header: 'Total', align: 'right', width: '120px', render: (row) => `₹${Number(row.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` },
                { key: 'outstandingAmount', header: 'Outstanding', align: 'right', width: '120px', render: (row) => (
                  <span className={Number(row.outstandingAmount) > 0 ? 'font-medium text-red-600' : 'font-medium text-green-600'}>
                    ₹{Number(row.outstandingAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                )},
                { key: 'actions', header: 'Actions', width: '160px', render: (row) => (
                  <div className="flex items-center justify-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => { setEditingOrder(row); setShowModal(true); }} aria-label="Edit order">
                      <Eye className="w-4 h-4" />
                    </Button>
                    {row.status === 'DRAFT' && (
                      <Button variant="ghost" size="sm" onClick={() => handleConfirm(row.id)} className="text-primary-600 hover:bg-primary-50" aria-label="Confirm order">
                        Confirm
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(row.id)} aria-label="Delete order" className="text-red-600 hover:bg-red-50">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )},
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
              emptyMessage="No orders found"
            />
          )}
        </CardBody>
      </Card>

      <Modal
        isOpen={showModal || !!viewingOrder}
        onClose={closeModal}
        title={editingOrder ? 'Edit Order' : 'Create Order'}
        size="xl"
      >
        {editingOrder ? (
          <div className="space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Order Number</label>
                <p className="font-mono text-secondary-900">{editingOrder.orderNumber}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Customer</label>
                <p className="text-secondary-900">{editingOrder.customerId}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Date</label>
                <p className="text-secondary-900">{new Date(editingOrder.orderDate).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Select
                label="Status"
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

            <div className="grid grid-cols-3 gap-4">
              <Input label="Subtotal" type="number" step="0.01" value={editingOrder.subtotal} onChange={(e) => setEditingOrder({ ...editingOrder, subtotal: Number(e.target.value) })} disabled />
              <Input label="Tax Amount" type="number" step="0.01" value={editingOrder.taxAmount} onChange={(e) => setEditingOrder({ ...editingOrder, taxAmount: Number(e.target.value) })} disabled />
              <Input label="Discount" type="number" step="0.01" value={editingOrder.discountAmount} onChange={(e) => setEditingOrder({ ...editingOrder, discountAmount: Number(e.target.value) })} disabled />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Input label="Total Amount" type="number" step="0.01" value={editingOrder.totalAmount} onChange={(e) => setEditingOrder({ ...editingOrder, totalAmount: Number(e.target.value) })} disabled className="font-bold" />
              <Input label="Paid Amount" type="number" step="0.01" value={editingOrder.paidAmount} onChange={(e) => setEditingOrder({ ...editingOrder, paidAmount: Number(e.target.value) })} disabled />
              <Input label="Outstanding" type="number" step="0.01" value={editingOrder.outstandingAmount} onChange={(e) => setEditingOrder({ ...editingOrder, outstandingAmount: Number(e.target.value) })} disabled className="text-red-600 font-bold" />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">Notes</label>
              <textarea
                value={editingOrder.notes || ''}
                onChange={(e) => setEditingOrder({ ...editingOrder, notes: e.target.value })}
                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-secondary-200">
              <Button type="button" variant="secondary" onClick={closeModal}>Close</Button>
            </div>
          </div>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); toast.error('Order creation form - implement with customer selection'); }} className="space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="text-center py-8 text-secondary-500">
              <Package className="w-12 h-12 mx-auto mb-4 text-secondary-300" />
              <p>Order creation requires customer selection and line items.</p>
              <p className="text-sm mt-2">This would typically open a multi-step wizard.</p>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-secondary-200">
              <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};