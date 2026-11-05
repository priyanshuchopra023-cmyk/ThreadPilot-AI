import React, { useState } from 'react';
import { 
  Search, 
  Package2, 
  AlertTriangle, 
  Plus, 
  Minus, 
  Layers, 
  Boxes, 
  DollarSign, 
  ArrowUpDown 
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
import { TextileIntelligenceCard } from '../components/intelligence/TextileIntelligenceCard';
import { inventoryApi } from '../api/endpoints';
import type { Inventory as InventoryType, PaginatedResponse } from '../types';
import toast from 'react-hot-toast';

export const Inventory: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [showVelocityIntel, setShowVelocityIntel] = useState(true);
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
      const pageData = res.data as PaginatedResponse<InventoryType> | undefined;
      return pageData?.content || [];
    },
  });

  const adjustMutation = useMutation({
    mutationFn: ({ id, data: adjustData }: { id: string; data: { quantity: number; type: string; notes?: string } }) =>
      inventoryApi.adjustStock(id, adjustData),
    onSuccess: () => {
      toast.success('Stock adjusted successfully');
      closeAdjustModal();
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : 'Failed to adjust stock');
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
    adjustMutation.mutate({ 
      id: adjustingItem.id, 
      data: { quantity: adjustQty, type: adjustType, notes: adjustNotes } 
    });
  };

  if (isLoading && !data) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-navy-100 rounded w-48" />
        <Card><CardBody className="p-6 h-64"><div className="h-4 bg-navy-100 rounded w-1/4 mb-4"/><div className="space-y-3"><div className="h-10 bg-navy-100 rounded"/><div className="h-10 bg-navy-100 rounded"/></div></CardBody></Card>
      </div>
    );
  }

  const inventory = data || [];
  const totalItems = data?.length || 0;
  const totalValuation = inventory.reduce((sum, item) => sum + Number(item.totalValue || 0), 0);
  const totalUnits = inventory.reduce((sum, item) => sum + Number(item.currentQuantity || 0), 0);
  const lowStockCount = inventory.filter(item => Number(item.availableQuantity || 0) <= 10).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Inventory"
        subtitle="Real-time stock valuation, warehouse balances, and reserve movements"
        breadcrumbs={[
          { label: 'Operations' },
          { label: 'Inventory' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button 
              variant={showVelocityIntel ? 'brass' : 'secondary'}
              size="sm"
              onClick={() => setShowVelocityIntel(!showVelocityIntel)} 
              leftIcon={<Layers className="w-3.5 h-3.5" />}
            >
              {showVelocityIntel ? 'Velocity Intel' : 'Show Velocity'}
            </Button>
            <Button 
              variant={lowStockOnly ? 'danger' : 'secondary'}
              size="sm"
              onClick={() => { setLowStockOnly(!lowStockOnly); setPage(1); }} 
              leftIcon={<AlertTriangle className="w-3.5 h-3.5" />}
            >
              {lowStockOnly ? 'Showing Low Stock' : 'Filter Low Stock'}
            </Button>
          </div>
        }
      />

      {/* Valuation & Stock KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white border border-navy-100 rounded-xl shadow-card flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-navy-50 text-navy-700 flex items-center justify-center flex-shrink-0">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-navy-500">Total Units In Stock</p>
            <p className="text-xl font-bold text-navy-900 font-mono tabular-nums">{totalUnits.toLocaleString()}</p>
          </div>
        </div>

        <div className="p-4 bg-white border border-navy-100 rounded-xl shadow-card flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-brass-50 text-brass-700 flex items-center justify-center flex-shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-navy-500">Stock Valuation at Cost</p>
            <p className="text-xl font-bold text-navy-900 font-mono tabular-nums">
              ₹{totalValuation.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <div className="p-4 bg-white border border-navy-100 rounded-xl shadow-card flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-warning-50 text-warning-700 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-navy-500">Low Stock SKUs</p>
            <p className="text-xl font-bold text-warning-700 font-mono tabular-nums">{lowStockCount}</p>
          </div>
        </div>
      </div>

      {/* Textile Velocity & Coverage Intelligence */}
      {showVelocityIntel && <TextileIntelligenceCard />}

      {/* Filter and Search Bar */}
      <Card>
        <CardBody className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400 w-4 h-4" />
              <Input
                placeholder="Search inventory records..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-9 bg-navy-50/40"
              />
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={pageSize.toString()}
                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                options={[
                  { value: '10', label: '10 per page' }, 
                  { value: '25', label: '25 per page' }, 
                  { value: '50', label: '50 per page' }
                ]}
                placeholder="Page size"
                className="w-full sm:w-36"
              />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Table Card */}
      <Card className="overflow-hidden">
        <CardBody className="p-0">
          {error ? (
            <div className="p-8 text-center text-danger-600 font-medium text-sm">Failed to load inventory</div>
          ) : (
            <DataTable
              data={inventory}
              columns={[
                { 
                  key: 'id', 
                  header: 'Batch / Lot ID', 
                  width: '120px', 
                  render: (row) => (
                    <span className="font-mono text-xs font-semibold text-navy-800">
                      {row.id ? `${row.id.slice(0, 8)}...` : '—'}
                    </span>
                  ) 
                },
                { 
                  key: 'productId', 
                  header: 'Product Ref', 
                  width: '130px', 
                  render: (row) => (
                    <span className="font-mono text-xs text-navy-600">
                      {row.productId ? `${row.productId.slice(0, 8)}...` : '—'}
                    </span>
                  ) 
                },
                { 
                  key: 'currentQuantity', 
                  header: 'Current', 
                  align: 'center', 
                  width: '90px',
                  render: (row) => (
                    <span className="font-mono text-xs font-semibold text-navy-900 tabular-nums">
                      {row.currentQuantity}
                    </span>
                  )
                },
                { 
                  key: 'reservedQuantity', 
                  header: 'Reserved', 
                  align: 'center', 
                  width: '90px',
                  render: (row) => (
                    <span className="font-mono text-xs text-navy-500 tabular-nums">
                      {row.reservedQuantity}
                    </span>
                  )
                },
                { 
                  key: 'availableQuantity', 
                  header: 'Available', 
                  align: 'center', 
                  width: '100px', 
                  render: (row) => {
                    const qty = Number(row.availableQuantity || 0);
                    return (
                      <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded tabular-nums ${
                        qty <= 0 ? 'bg-danger-50 text-danger-700' : qty <= 10 ? 'bg-warning-50 text-warning-800' : 'bg-success-50 text-success-800'
                      }`}>
                        {qty}
                      </span>
                    );
                  }
                },
                { 
                  key: 'incomingQuantity', 
                  header: 'Incoming', 
                  align: 'center', 
                  width: '90px',
                  render: (row) => (
                    <span className="font-mono text-xs text-blue-600 tabular-nums">
                      {row.incomingQuantity || 0}
                    </span>
                  )
                },
                { 
                  key: 'averageCost', 
                  header: 'Avg Cost', 
                  align: 'right', 
                  width: '110px', 
                  render: (row) => (
                    <span className="font-mono text-xs text-navy-700 tabular-nums">
                      ₹{Number(row.averageCost || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  )
                },
                { 
                  key: 'totalValue', 
                  header: 'Total Value', 
                  align: 'right', 
                  width: '130px', 
                  render: (row) => (
                    <span className="font-mono text-xs font-bold text-navy-900 tabular-nums">
                      ₹{Number(row.totalValue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  )
                },
                { 
                  key: 'actions', 
                  header: 'Quick Adjustment', 
                  width: '140px', 
                  align: 'center',
                  render: (row) => (
                    <div className="flex items-center justify-center gap-1.5">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => openAdjustModal(row, 'IN')} 
                        leftIcon={<Plus className="w-3 h-3" />} 
                        className="text-success-700 hover:bg-success-50 text-xs px-2 py-1 h-7 font-semibold" 
                        aria-label="Add stock"
                      >
                        In
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => openAdjustModal(row, 'OUT')} 
                        leftIcon={<Minus className="w-3 h-3" />} 
                        className="text-danger-600 hover:bg-danger-50 text-xs px-2 py-1 h-7 font-semibold" 
                        aria-label="Remove stock"
                      >
                        Out
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
              emptyMessage="No inventory records found"
            />
          )}
        </CardBody>
      </Card>

      {/* Adjust Stock Modal */}
      <Modal
        isOpen={showAdjustModal}
        onClose={closeAdjustModal}
        title={adjustType === 'IN' ? 'Add Stock' : 'Remove Stock'}
        size="sm"
      >
        <form onSubmit={handleAdjustSubmit} className="space-y-4">
          {adjustingItem && (
            <div className="bg-navy-50/70 border border-navy-100 p-3.5 rounded-xl">
              <p className="text-xs font-semibold text-navy-900">
                Item: {adjustingItem.productId?.slice(0, 8) || adjustingItem.variantId?.slice(0, 8) || 'N/A'}
              </p>
              <p className="text-xs text-navy-500 mt-1">
                Current Available Stock: <span className="font-bold text-navy-900 font-mono">{adjustingItem.availableQuantity}</span>
              </p>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-navy-500 mb-1.5">
              Adjustment Type
            </label>
            <Select
              value={adjustType}
              onChange={(e) => setAdjustType(e.target.value as 'IN' | 'OUT')}
              options={[
                { value: 'IN', label: 'Stock In (Purchase Receipt / Return)' },
                { value: 'OUT', label: 'Stock Out (Sale Dispatch / Damage / Sample)' },
              ]}
            />
          </div>

          <Input
            label="Adjustment Quantity *"
            type="number"
            min="1"
            value={adjustQty}
            onChange={(e) => setAdjustQty(Number(e.target.value) || 0)}
            placeholder="Enter quantity"
          />

          <Input
            label="Adjustment Reason / Note"
            value={adjustNotes}
            onChange={(e) => setAdjustNotes(e.target.value)}
            placeholder="Reason for adjustment, lot ref, etc."
          />

          <div className="flex justify-end gap-2.5 pt-4 border-t border-navy-100">
            <Button type="button" variant="secondary" onClick={closeAdjustModal}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="primary"
              loading={adjustMutation.isPending}
            >
              {adjustType === 'IN' ? 'Add Stock' : 'Remove Stock'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Inventory;
