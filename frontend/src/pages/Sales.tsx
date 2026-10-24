import React, { useState } from 'react';
import { Search, Filter, DollarSign, Plus, Edit, Trash2, Eye, ChevronDown, Calendar, Download } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { DataTable } from '../components/tables/DataTable';
import { Badge } from '../components/ui/Badge';
import { saleApi } from '../api/endpoints';
import type { Sale, PaginatedResponse } from '../types';
import toast from 'react-hot-toast';

export const Sales: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showModal, setShowModal] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [viewingSale, setViewingSale] = useState<Sale | null>(null);

  const { data, isLoading, error } = useQuery<Sale[]>({
    queryKey: ['sales', page, pageSize, search, startDate, endDate],
    queryFn: async () => {
      const res = await saleApi.list({ page, size: pageSize, startDate, endDate });
      return (res.data as unknown) as Sale[];
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<Sale>) => saleApi.create(data),
    onSuccess: () => {
      toast.success('Sale created successfully');
      closeModal();
      queryClient.invalidateQueries({ queryKey: ['sales'] });
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Failed to create sale');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => saleApi.delete(id),
    onSuccess: () => {
      toast.success('Sale deleted');
      queryClient.invalidateQueries({ queryKey: ['sales'] });
    },
    onError: () => toast.error('Failed to delete sale'),
  });

  const closeModal = () => {
    setShowModal(false);
    setEditingSale(null);
    setViewingSale(null);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this sale?')) {
      deleteMutation.mutate(id);
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

  const sales = data || [];
  const totalItems = data?.length || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-primary-600" />
            Sales
          </h1>
          <p className="text-secondary-600 mt-1">Track all sales transactions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" leftIcon={<Download className="w-4 h-4" />}>Export</Button>
          <Button onClick={() => { setEditingSale(null); setShowModal(true); }} leftIcon={<Plus className="w-4 h-4" />}>
            Record Sale
          </Button>
        </div>
      </div>

      <Card>
        <CardBody className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400 w-5 h-5" />
              <Input
                placeholder="Search sales..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Input
                label="From"
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                placeholder="Start date"
                className="w-full sm:w-40"
              />
              <Input
                label="To"
                type="date"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                placeholder="End date"
                className="w-full sm:w-40"
              />
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="p-0">
          {error ? (
            <div className="p-6 text-center text-red-600">Failed to load sales</div>
          ) : (
            <DataTable<Sale>
              data={sales}
              columns={[
                { key: 'saleNumber', header: 'Sale #', width: '130px' },
                { key: 'saleDate', header: 'Date', width: '110px' },
                { key: 'customerName', header: 'Customer' },
                { key: 'subtotal', header: 'Subtotal', align: 'right', width: '120px', render: (row: Sale) => `₹${Number(row.subtotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` },
                { key: 'taxAmount', header: 'Tax', align: 'right', width: '100px', render: (row: Sale) => `₹${Number(row.taxAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` },
                { key: 'discountAmount', header: 'Discount', align: 'right', width: '100px', render: (row: Sale) => `₹${Number(row.discountAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` },
                { key: 'totalAmount', header: 'Total', align: 'right', width: '120px', render: (row: Sale) => <span className="font-bold">₹{Number(row.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span> },
                { key: 'grossProfit', header: 'Profit', align: 'right', width: '120px', render: (row: Sale) => (
                  <span className={Number(row.grossProfit) >= 0 ? 'font-medium text-green-600' : 'font-medium text-red-600'}>
                    ₹{Number(row.grossProfit).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                )},
                { key: 'actions', header: 'Actions', width: '120px', render: (row) => (
                  <div className="flex items-center justify-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => { setViewingSale(row); setShowModal(true); }} aria-label="View sale">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(row.id)} aria-label="Delete sale" className="text-red-600 hover:bg-red-50">
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
              emptyMessage="No sales found"
            />
          )}
        </CardBody>
      </Card>

      <Modal
        isOpen={showModal && (!!editingSale || !!viewingSale)}
        onClose={closeModal}
        title={viewingSale ? `Sale Details: ${viewingSale.saleNumber}` : 'Record Sale'}
        size="xl"
      >
        {viewingSale ? (
          <div className="space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Sale Number</label>
                <p className="font-mono text-secondary-900">{viewingSale.saleNumber}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Date</label>
                <p className="text-secondary-900">{new Date(viewingSale.saleDate).toLocaleDateString()}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Customer</label>
                <p className="text-secondary-900">{viewingSale.customerId || 'Walk-in'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Order Ref</label>
                <p className="text-secondary-900">{viewingSale.orderId || '—'}</p>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <Input label="Subtotal" type="number" step="0.01" value={viewingSale.subtotal} disabled className="bg-secondary-50" />
              <Input label="Tax Amount" type="number" step="0.01" value={viewingSale.taxAmount} disabled className="bg-secondary-50" />
              <Input label="Discount" type="number" step="0.01" value={viewingSale.discountAmount} disabled className="bg-secondary-50" />
              <Input label="Cost Amount" type="number" step="0.01" value={viewingSale.costAmount} disabled className="bg-secondary-50" />
            </div>

            <div className="grid grid-cols-4 gap-4">
              <Input label="Total Amount" type="number" step="0.01" value={viewingSale.totalAmount} disabled className="bg-secondary-50 font-bold" />
              <Input label="Gross Profit" type="number" step="0.01" value={viewingSale.grossProfit} disabled className={`bg-secondary-50 font-bold ${Number(viewingSale.grossProfit) >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              <Input label="Margin %" type="number" step="0.01" value={viewingSale.totalAmount > 0 ? (Number(viewingSale.grossProfit) / Number(viewingSale.totalAmount) * 100).toFixed(2) : '0'} disabled className="bg-secondary-50" />
            </div>

            {viewingSale.notes && (
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Notes</label>
                <p className="text-secondary-600">{viewingSale.notes}</p>
              </div>
            )}

            <h4 className="font-medium text-secondary-900 pt-4 border-t border-secondary-200">Sale Items</h4>
            <DataTable
              data={viewingSale.items}
              columns={[
                { key: 'id', header: 'Item', width: '80px', render: (row) => <span className="font-mono text-xs">{row.id.slice(0, 8)}...</span> },
                { key: 'productId', header: 'Product', width: '100px', render: (row) => row.productId ? <span className="font-mono text-xs">{row.productId.slice(0, 8)}...</span> : '—' },
                { key: 'quantity', header: 'Qty', align: 'center', width: '60px' },
                { key: 'unitPrice', header: 'Unit Price', align: 'right', width: '100px', render: (row) => `₹${Number(row.unitPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` },
                { key: 'unitCost', header: 'Unit Cost', align: 'right', width: '100px', render: (row) => `₹${Number(row.unitCost).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` },
                { key: 'taxRate', header: 'Tax %', align: 'center', width: '70px', render: (row) => `${row.taxRate}%` },
                { key: 'discountRate', header: 'Disc %', align: 'center', width: '70px', render: (row) => `${row.discountRate}%` },
                { key: 'lineTotal', header: 'Line Total', align: 'right', width: '110px', render: (row) => `₹${Number(row.lineTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` },
                { key: 'costAmount', header: 'Cost', align: 'right', width: '100px', render: (row) => `₹${Number(row.costAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` },
                { key: 'grossProfit', header: 'Profit', align: 'right', width: '100px', render: (row) => (
                  <span className={Number(row.lineTotal) - Number(row.costAmount) >= 0 ? 'text-green-600' : 'text-red-600'}>
                    ₹{(Number(row.lineTotal) - Number(row.costAmount)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                )},
              ]}
              keyExtractor={(row) => row.id}
              searchable={false}
              sortable={false}
              pagination={{ enabled: false }}
              emptyMessage="No items"
            />
            <div className="flex justify-end gap-3 pt-4 border-t border-secondary-200">
              <Button type="button" variant="secondary" onClick={closeModal}>Close</Button>
            </div>
          </div>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); toast.error('Sale creation form - implement with customer/product selection'); }} className="space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="text-center py-8 text-secondary-500">
              <DollarSign className="w-12 h-12 mx-auto mb-4 text-secondary-300" />
              <p>Sale recording requires customer and product selection.</p>
              <p className="text-sm mt-2">This would typically open a POS-style interface.</p>
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