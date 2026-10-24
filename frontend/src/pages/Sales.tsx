import React, { useState } from 'react';
import { 
  Search, 
  DollarSign, 
  Plus, 
  Trash2, 
  Eye, 
  TrendingUp, 
  Calendar, 
  Download, 
  ShoppingBag,
  Percent
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardBody } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { DataTable } from '../components/tables/DataTable';
import { Badge } from '../components/ui/Badge';
import { PageHeader } from '../components/ui/PageHeader';
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
      const pageData = res.data as PaginatedResponse<Sale> | undefined;
      return pageData?.content || [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => saleApi.delete(id),
    onSuccess: () => {
      toast.success('Sale record deleted');
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
    if (window.confirm('Are you sure you want to delete this sale record?')) {
      deleteMutation.mutate(id);
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

  const sales = data || [];
  const totalItems = data?.length || 0;
  const totalRevenue = sales.reduce((acc, s) => acc + Number(s.totalAmount || 0), 0);
  const totalGrossProfit = sales.reduce((acc, s) => acc + Number(s.grossProfit || 0), 0);
  const avgMargin = totalRevenue > 0 ? (totalGrossProfit / totalRevenue) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Sales"
        subtitle="Historical sales transactions, line-item margin analysis, and customer revenue ledgers"
        breadcrumbs={[
          { label: 'Commerce' },
          { label: 'Sales' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button 
              onClick={() => { setEditingSale(null); setShowModal(true); }} 
              variant="primary"
              leftIcon={<Plus className="w-4 h-4" />}
              className="shadow-sm"
            >
              Record Sale
            </Button>
          </div>
        }
      />

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white border border-navy-100 rounded-xl shadow-card flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-navy-50 text-navy-700 flex items-center justify-center flex-shrink-0">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-navy-500">Total Recognized Revenue</p>
            <p className="text-xl font-bold text-navy-900 font-mono tabular-nums">
              ₹{totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <div className="p-4 bg-white border border-navy-100 rounded-xl shadow-card flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-success-50 text-success-700 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-navy-500">Gross Profit</p>
            <p className="text-xl font-bold text-success-800 font-mono tabular-nums">
              ₹{totalGrossProfit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <div className="p-4 bg-white border border-navy-100 rounded-xl shadow-card flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-brass-50 text-brass-700 flex items-center justify-center flex-shrink-0">
            <Percent className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-navy-500">Average Profit Margin</p>
            <p className="text-xl font-bold text-navy-900 font-mono tabular-nums">
              {avgMargin.toFixed(1)}%
            </p>
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
                placeholder="Search sales transactions..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-9 bg-navy-50/40"
              />
            </div>
            <div className="flex gap-2">
              <Input
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                className="w-full sm:w-36 text-xs font-mono"
              />
              <Input
                type="date"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                className="w-full sm:w-36 text-xs font-mono"
              />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Table Card */}
      <Card className="overflow-hidden">
        <CardBody className="p-0">
          {error ? (
            <div className="p-8 text-center text-danger-600 font-medium text-sm">Failed to load sales transactions</div>
          ) : (
            <DataTable<Sale>
              data={sales}
              columns={[
                { 
                  key: 'saleNumber', 
                  header: 'Sale #', 
                  width: '130px',
                  render: (row: Sale) => (
                    <span className="font-mono text-xs font-semibold text-navy-900">
                      {row.saleNumber}
                    </span>
                  )
                },
                { 
                  key: 'saleDate', 
                  header: 'Date', 
                  width: '110px',
                  render: (row: Sale) => (
                    <span className="text-xs text-navy-600 font-mono">
                      {row.saleDate}
                    </span>
                  )
                },
                { 
                  key: 'customerName', 
                  header: 'Customer',
                  render: (row: Sale) => (
                    <span className="text-xs font-medium text-navy-900">
                      {row.customerName || 'Walk-in Customer'}
                    </span>
                  )
                },
                { 
                  key: 'subtotal', 
                  header: 'Subtotal', 
                  align: 'right', 
                  width: '120px', 
                  render: (row: Sale) => (
                    <span className="font-mono text-xs text-navy-600 tabular-nums">
                      ₹{Number(row.subtotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  )
                },
                { 
                  key: 'taxAmount', 
                  header: 'GST Tax', 
                  align: 'right', 
                  width: '100px', 
                  render: (row: Sale) => (
                    <span className="font-mono text-xs text-navy-500 tabular-nums">
                      ₹{Number(row.taxAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  )
                },
                { 
                  key: 'totalAmount', 
                  header: 'Total Net', 
                  align: 'right', 
                  width: '130px', 
                  render: (row: Sale) => (
                    <span className="font-mono text-xs font-bold text-navy-900 tabular-nums">
                      ₹{Number(row.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  ) 
                },
                { 
                  key: 'grossProfit', 
                  header: 'Gross Profit', 
                  align: 'right', 
                  width: '120px', 
                  render: (row: Sale) => {
                    const profit = Number(row.grossProfit || 0);
                    return (
                      <span className={`font-mono text-xs font-bold tabular-nums ${
                        profit >= 0 ? 'text-success-700' : 'text-danger-700'
                      }`}>
                        ₹{profit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    );
                  }
                },
                { 
                  key: 'actions', 
                  header: '', 
                  width: '90px', 
                  align: 'center',
                  render: (row: Sale) => (
                    <div className="flex items-center justify-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => { setViewingSale(row); setShowModal(true); }} 
                        aria-label="View sale"
                        className="text-navy-600 hover:text-navy-900 p-1.5 h-7 w-7"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDelete(row.id)} 
                        aria-label="Delete sale" 
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
              emptyMessage="No sales transactions recorded"
            />
          )}
        </CardBody>
      </Card>

      {/* Detail Modal */}
      <Modal
        isOpen={showModal && (!!editingSale || !!viewingSale)}
        onClose={closeModal}
        title={viewingSale ? `Sale Receipt: ${viewingSale.saleNumber}` : 'Record Sale'}
        size="lg"
      >
        {viewingSale ? (
          <div className="space-y-4 max-h-[72vh] overflow-y-auto px-1 py-1">
            <div className="grid grid-cols-3 gap-3 p-3.5 bg-navy-50/70 border border-navy-100 rounded-xl">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-navy-500">Receipt #</p>
                <p className="font-mono text-xs font-bold text-navy-900 mt-0.5">{viewingSale.saleNumber}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-navy-500">Transaction Date</p>
                <p className="font-mono text-xs text-navy-900 mt-0.5">{new Date(viewingSale.saleDate).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-navy-500">Customer</p>
                <p className="text-xs font-semibold text-navy-900 mt-0.5 truncate">{viewingSale.customerName || viewingSale.customerId || 'Walk-in'}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 p-3.5 bg-white border border-navy-100 rounded-xl">
              <Input label="Subtotal (₹)" type="number" step="0.01" value={viewingSale.subtotal} disabled />
              <Input label="Tax Amount (₹)" type="number" step="0.01" value={viewingSale.taxAmount} disabled />
              <Input label="Discount (₹)" type="number" step="0.01" value={viewingSale.discountAmount} disabled />
            </div>

            <div className="grid grid-cols-3 gap-3 p-3.5 bg-navy-50/50 border border-navy-100 rounded-xl">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-navy-500">Total Net Amount</p>
                <p className="font-mono text-base font-bold text-navy-900 mt-0.5">
                  ₹{Number(viewingSale.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-navy-500">Gross Margin</p>
                <p className="font-mono text-base font-bold text-success-700 mt-0.5">
                  ₹{Number(viewingSale.grossProfit).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-navy-500">Margin Rate</p>
                <p className="font-mono text-base font-bold text-navy-800 mt-0.5">
                  {viewingSale.totalAmount > 0 ? ((Number(viewingSale.grossProfit) / Number(viewingSale.totalAmount)) * 100).toFixed(1) : '0.0'}%
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-4 border-t border-navy-100">
              <Button type="button" variant="secondary" onClick={closeModal}>
                Close
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center text-navy-600">
            <DollarSign className="w-10 h-10 mx-auto mb-3 text-navy-300" />
            <p className="text-sm font-semibold text-navy-900">Direct Sales Entry</p>
            <p className="text-xs text-navy-500 mt-1 max-w-sm mx-auto">
              Direct counter sales point-of-sale checkout with barcode scanning.
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

export default Sales;
