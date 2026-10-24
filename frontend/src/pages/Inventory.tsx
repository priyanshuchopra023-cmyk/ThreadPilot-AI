import React, { useState, FormEvent } from 'react';
import { Search, Filter, Package2, AlertTriangle, ChevronDown, Plus, Minus } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { DataTable } from '../components/tables/DataTable';
import { Badge } from '../components/ui/Badge';
import { inventoryApi } from '../api/endpoints';
import type { Inventory as InventoryType, PaginatedResponse } from '../types';
import toast from 'react-hot-toast';

export const Inventory: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustingItem, setAdjustingItem] = useState<InventoryType | null>(null);
  const [adjustQty, setAdjustQty] = useState(0);
  const [adjustType, setAdjustType] = useState('IN');
  const [adjustNotes, setAdjustNotes] = useState('');

  const { data, isLoading, error } = useQuery<InventoryType[]>({
    queryKey: ['inventory', page, pageSize, search, lowStockOnly],
    queryFn: async () => {
      const res = await inventoryApi.list({ page, size: pageSize, lowStock: lowStockOnly });
      return (res.data as unknown) as InventoryType[];
    },
  });

  const adjustMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { quantity: number; type: string; notes?: string } }) =>
      inventoryApi.adjustStock(id, data),
    onSuccess: () => {
      toast.success('Stock adjusted successfully');
      closeAdjustModal();
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Failed to adjust stock');
    },
  });

  const openAdjustModal = (item: InventoryType, type: 'IN' | 'OUT') => {
    setAdjustingItem(item);
    setAdjustType(type);
    setAdjustQty(1);
    setAdjustNotes('');
    setShowAdjustModal(true);
  };

  const closeAdjustModal = () => {
    setShowAdjustModal(false);
    setAdjustingItem(null);
    setAdjustQty(0);
    setAdjustNotes('');
  };

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingItem || adjustQty <= 0) return;
    adjustMutation.mutate({ id: adjustingItem.id, data: { quantity: adjustQty, type: adjustType, notes: adjustNotes } });
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

  const inventory = data || [];
  const totalItems = data?.length || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 flex items-center gap-2">
            <Package2 className="w-6 h-6 text-primary-600" />
            Inventory
          </h1>
          <p className="text-secondary-600 mt-1">Track stock levels and movements</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => { setLowStockOnly(!lowStockOnly); setPage(1); }} leftIcon={<AlertTriangle className="w-4 h-4" />}>
            {lowStockOnly ? 'Show All' : 'Low Stock Only'}
          </Button>
        </div>
      </div>

      <Card>
        <CardBody className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400 w-5 h-5" />
              <Input
                placeholder="Search inventory..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-10"
              />
            </div>
            <Select
              value={pageSize.toString()}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
              options={[{ value: '10', label: '10 per page' }, { value: '25', label: '25 per page' }, { value: '50', label: '50 per page' }]}
              placeholder="Page size"
              className="w-full sm:w-40"
            />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="p-0">
          {error ? (
            <div className="p-6 text-center text-red-600">Failed to load inventory</div>
          ) : (
            <DataTable
              data={inventory}
              columns={[
                { key: 'id', header: 'ID', width: '100px', render: (row) => <span className="font-mono text-xs">{row.id.slice(0, 8)}...</span> },
                { key: 'productId', header: 'Product ID', width: '120px', render: (row) => row.productId ? <span className="font-mono text-xs">{row.productId.slice(0, 8)}...</span> : '—' },
                { key: 'variantId', header: 'Variant ID', width: '120px', render: (row) => row.variantId ? <span className="font-mono text-xs">{row.variantId.slice(0, 8)}...</span> : '—' },
                { key: 'currentQuantity', header: 'Current', align: 'center', width: '80px' },
                { key: 'reservedQuantity', header: 'Reserved', align: 'center', width: '80px' },
                { key: 'availableQuantity', header: 'Available', align: 'center', width: '100px', render: (row) => (
                  <span className={row.availableQuantity <= 0 ? 'font-medium text-red-600' : row.availableQuantity <= 10 ? 'font-medium text-yellow-600' : 'font-medium text-green-600'}>
                    {row.availableQuantity}
                  </span>
                )},
                { key: 'incomingQuantity', header: 'Incoming', align: 'center', width: '80px' },
                { key: 'averageCost', header: 'Avg Cost', align: 'right', width: '100px', render: (row) => `₹${Number(row.averageCost).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` },
                { key: 'totalValue', header: 'Total Value', align: 'right', width: '120px', render: (row) => `₹${Number(row.totalValue).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` },
                { key: 'actions', header: 'Actions', width: '140px', render: (row) => (
                  <div className="flex items-center justify-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openAdjustModal(row, 'IN')} leftIcon={<Plus className="w-3 h-3" />} className="text-green-600 hover:bg-green-50" aria-label="Add stock">
                      In
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openAdjustModal(row, 'OUT')} leftIcon={<Minus className="w-3 h-3" />} className="text-red-600 hover:bg-red-50" aria-label="Remove stock">
                      Out
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
              emptyMessage="No inventory records found"
            />
          )}
        </CardBody>
      </Card>

      <Modal
        isOpen={showAdjustModal}
        onClose={closeAdjustModal}
        title={adjustType === 'IN' ? 'Add Stock' : 'Remove Stock'}
        size="sm"
      >
        <form onSubmit={handleAdjustSubmit} className="space-y-4">
          {adjustingItem && (
            <div className="bg-secondary-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-secondary-900">Product ID: {adjustingItem.productId?.slice(0, 8) || adjustingItem.variantId?.slice(0, 8) || 'N/A'}</p>
              <p className="text-sm text-secondary-600">Current Available: <span className="font-medium">{adjustingItem.availableQuantity}</span></p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">Adjustment Type</label>
            <Select
              value={adjustType}
              onChange={(e) => setAdjustType(e.target.value as 'IN' | 'OUT')}
              options={[
                { value: 'IN', label: 'Stock In (Purchase/Return)' },
                { value: 'OUT', label: 'Stock Out (Sale/Damage/Adjustment)' },
              ]}
            />
          </div>
          <Input
            label="Quantity *"
            type="number"
            min="1"
            value={adjustQty}
            onChange={(e) => setAdjustQty(Number(e.target.value) || 0)}
            placeholder="Enter quantity"
          />
          <Input
            label="Notes"
            value={adjustNotes}
            onChange={(e) => setAdjustNotes(e.target.value)}
            placeholder="Reason for adjustment"
          />
          <div className="flex justify-end gap-3 pt-4 border-t border-secondary-200">
            <Button type="button" variant="secondary" onClick={closeAdjustModal}>Cancel</Button>
            <Button type="submit" loading={adjustMutation.isPending}>
              {adjustType === 'IN' ? 'Add Stock' : 'Remove Stock'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};