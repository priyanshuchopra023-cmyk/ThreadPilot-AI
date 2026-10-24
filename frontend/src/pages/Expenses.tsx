import React, { useState } from 'react';
import { 
  Search, 
  Receipt, 
  Plus, 
  Edit, 
  Trash2, 
  DollarSign, 
  Building, 
  PieChart,
  CheckCircle2,
  Clock
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
import { expenseApi } from '../api/endpoints';
import type { Expense, PaginatedResponse } from '../types';
import toast from 'react-hot-toast';

const categoryOptions = [
  { value: 'RENT', label: 'Rent' },
  { value: 'UTILITIES', label: 'Utilities (Electricity/Power)' },
  { value: 'SALARIES', label: 'Wages & Factory Labor' },
  { value: 'MARKETING', label: 'Marketing & Samples' },
  { value: 'TRAVEL', label: 'Travel & Logistics' },
  { value: 'OFFICE_SUPPLIES', label: 'Office Supplies' },
  { value: 'EQUIPMENT', label: 'Plant Equipment & Machinery' },
  { value: 'SOFTWARE', label: 'Software & Technology' },
  { value: 'INSURANCE', label: 'Insurance' },
  { value: 'LEGAL', label: 'Legal & Compliance' },
  { value: 'ACCOUNTING', label: 'Accounting & Audit' },
  { value: 'MAINTENANCE', label: 'Machine Maintenance & Spare Parts' },
  { value: 'SHIPPING', label: 'Freight & Courier' },
  { value: 'PACKAGING', label: 'Packaging Materials (Boxes/Poly)' },
  { value: 'OTHER', label: 'Other Operating Expense' },
];

const methodOptions = [
  { value: 'CASH', label: 'Cash / Petty Cash' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer (NEFT/RTGS)' },
  { value: 'UPI', label: 'UPI / Quick Pay' },
  { value: 'CARD', label: 'Corporate Card' },
  { value: 'CHEQUE', label: 'Bank Cheque' },
  { value: 'ONLINE', label: 'Online Payment' },
  { value: 'OTHER', label: 'Other' },
];

const initialFormData = {
  category: 'OTHER',
  expenseDate: new Date().toISOString().split('T')[0],
  amount: 0,
  paymentMethod: 'BANK_TRANSFER',
  vendorName: '',
  referenceNumber: '',
  description: '',
  receiptUrl: '',
  isRecurring: false,
  recurringFrequency: '',
};

type ExpenseFormData = typeof initialFormData;

export const Expenses: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [formData, setFormData] = useState<ExpenseFormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const { data, isLoading, error } = useQuery<Expense[]>({
    queryKey: ['expenses', page, pageSize, search, categoryFilter, startDate, endDate],
    queryFn: async () => {
      const res = await expenseApi.list({ page, size: pageSize, category: categoryFilter, startDate, endDate });
      const pageData = res.data as PaginatedResponse<Expense> | undefined;
      return pageData?.content || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: (expenseData: Partial<Expense>) => expenseApi.create(expenseData),
    onSuccess: () => {
      toast.success('Expense recorded successfully');
      closeModal();
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : 'Failed to record expense');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data: updateData }: { id: string; data: Partial<Expense> }) => 
      expenseApi.update(id, updateData),
    onSuccess: () => {
      toast.success('Expense updated successfully');
      closeModal();
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : 'Failed to update expense');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => expenseApi.delete(id),
    onSuccess: () => {
      toast.success('Expense record deleted');
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: () => toast.error('Failed to delete expense'),
  });

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.expenseDate) errors.expenseDate = 'Expense date is required';
    if (formData.amount <= 0) errors.amount = 'Amount must be greater than 0';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    const payload = { ...formData, amount: Number(formData.amount) } as Partial<Expense>;

    if (editingExpense) {
      updateMutation.mutate({ id: editingExpense.id, data: payload }, {
        onSettled: () => setSubmitting(false)
      });
    } else {
      createMutation.mutate(payload, {
        onSettled: () => setSubmitting(false)
      });
    }
  };

  const openCreateModal = () => {
    setEditingExpense(null);
    setFormData({ ...initialFormData, expenseDate: new Date().toISOString().split('T')[0] });
    setFormErrors({});
    setShowModal(true);
  };

  const openEditModal = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData({
      category: expense.category,
      expenseDate: expense.expenseDate ? expense.expenseDate.split('T')[0] : '',
      amount: expense.amount,
      paymentMethod: expense.paymentMethod,
      vendorName: expense.vendorName || '',
      referenceNumber: expense.referenceNumber || '',
      description: expense.description || '',
      receiptUrl: expense.receiptUrl || '',
      isRecurring: expense.isRecurring,
      recurringFrequency: expense.recurringFrequency || '',
    });
    setFormErrors({});
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingExpense(null);
    setFormData(initialFormData);
    setFormErrors({});
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this expense voucher?')) {
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

  const expenses = data || [];
  const totalItems = data?.length || 0;
  const totalExpenses = expenses.reduce((acc, e) => acc + Number(e.amount || 0), 0);
  const categoryCount = new Set(expenses.map(e => e.category)).size;

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Expenses"
        subtitle="Operational overhead, factory utilities, consumables, and operating expense ledger"
        breadcrumbs={[
          { label: 'Financials' },
          { label: 'Expenses' },
        ]}
        actions={
          <Button 
            onClick={openCreateModal} 
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            className="shadow-sm"
          >
            Add Expense
          </Button>
        }
      />

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white border border-navy-100 rounded-xl shadow-card flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-danger-50 text-danger-700 flex items-center justify-center flex-shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-navy-500">Total Overhead Logged</p>
            <p className="text-xl font-bold text-danger-800 font-mono tabular-nums">
              ₹{totalExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <div className="p-4 bg-white border border-navy-100 rounded-xl shadow-card flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-navy-50 text-navy-700 flex items-center justify-center flex-shrink-0">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-navy-500">Recorded Vouchers</p>
            <p className="text-xl font-bold text-navy-900 font-mono tabular-nums">{expenses.length}</p>
          </div>
        </div>

        <div className="p-4 bg-white border border-navy-100 rounded-xl shadow-card flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-brass-50 text-brass-700 flex items-center justify-center flex-shrink-0">
            <PieChart className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-navy-500">Active Cost Categories</p>
            <p className="text-xl font-bold text-navy-900 font-mono tabular-nums">
              {categoryCount} Types
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
                placeholder="Search expenses or vendors..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-9 bg-navy-50/40"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={categoryFilter}
                onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
                options={[{ value: '', label: 'All Categories' }, ...categoryOptions]}
                placeholder="Filter by category"
                className="w-full sm:w-44"
              />
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
            <div className="p-8 text-center text-danger-600 font-medium text-sm">Failed to load expenses</div>
          ) : (
            <DataTable<Expense>
              data={expenses}
              columns={[
                { 
                  key: 'expenseNumber', 
                  header: 'Expense #', 
                  width: '130px',
                  render: (row: Expense) => (
                    <span className="font-mono text-xs font-semibold text-navy-900">
                      {row.expenseNumber}
                    </span>
                  )
                },
                { 
                  key: 'expenseDate', 
                  header: 'Date', 
                  width: '110px',
                  render: (row: Expense) => (
                    <span className="text-xs text-navy-600 font-mono">
                      {row.expenseDate ? new Date(row.expenseDate).toLocaleDateString() : '—'}
                    </span>
                  )
                },
                { 
                  key: 'category', 
                  header: 'Category', 
                  width: '160px', 
                  render: (row: Expense) => (
                    <Badge variant="secondary" size="sm" className="font-mono text-[10px]">
                      {row.category.replace(/_/g, ' ')}
                    </Badge>
                  ) 
                },
                { 
                  key: 'vendorName', 
                  header: 'Beneficiary / Vendor', 
                  render: (row: Expense) => (
                    <span className="text-xs font-medium text-navy-800">
                      {row.vendorName || 'General / Sundry'}
                    </span>
                  )
                },
                { 
                  key: 'amount', 
                  header: 'Amount', 
                  align: 'right', 
                  width: '130px', 
                  render: (row: Expense) => (
                    <span className="font-mono text-xs font-bold text-navy-900 tabular-nums">
                      ₹{Number(row.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  ) 
                },
                { 
                  key: 'paymentMethod', 
                  header: 'Method', 
                  width: '130px', 
                  render: (row: Expense) => (
                    <span className="text-xs text-navy-600">
                      {row.paymentMethod.replace(/_/g, ' ')}
                    </span>
                  )
                },
                { 
                  key: 'approved', 
                  header: 'Audit Status', 
                  align: 'center', 
                  width: '110px', 
                  render: (row: Expense) => (
                    <Badge variant={row.approved ? 'success' : 'warning'} dot size="sm">
                      {row.approved ? 'Approved' : 'Pending'}
                    </Badge>
                  )
                },
                { 
                  key: 'actions', 
                  header: '', 
                  width: '90px', 
                  align: 'center',
                  render: (row: Expense) => (
                    <div className="flex items-center justify-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => openEditModal(row)} 
                        aria-label="Edit expense"
                        className="text-navy-600 hover:text-navy-900 p-1.5 h-7 w-7"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDelete(row.id)} 
                        aria-label="Delete expense" 
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
              emptyMessage="No expenses recorded"
            />
          )}
        </CardBody>
      </Card>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editingExpense ? 'Edit Expense Record' : 'Record Operating Expense'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[72vh] overflow-y-auto px-1 py-1">
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-navy-500 mb-2">
              Expense Allocation & Date
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <Select 
                label="Expense Category *" 
                name="category" 
                value={formData.category} 
                onChange={(e) => setFormData({ ...formData, category: e.target.value })} 
                options={categoryOptions} 
                placeholder="Select category" 
              />
              <Input 
                label="Expense Date *" 
                name="expenseDate" 
                type="date" 
                value={formData.expenseDate} 
                onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })} 
                error={formErrors.expenseDate} 
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-3.5">
              <Input 
                label="Disbursement Amount (₹) *" 
                name="amount" 
                type="number" 
                step="0.01" 
                min="0.01" 
                value={formData.amount} 
                onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })} 
                error={formErrors.amount} 
                placeholder="0.00" 
              />
              <Select 
                label="Payment Method *" 
                name="paymentMethod" 
                value={formData.paymentMethod} 
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })} 
                options={methodOptions} 
                placeholder="Select method" 
              />
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-navy-500 mb-2">
              Payee & Invoice Reference
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <Input 
                label="Vendor / Payee Name" 
                name="vendorName" 
                value={formData.vendorName} 
                onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })} 
                placeholder="Punjab State Power Corp / Landlord" 
              />
              <Input 
                label="Bill / Reference #" 
                name="referenceNumber" 
                value={formData.referenceNumber} 
                onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })} 
                placeholder="BILL-2024-098" 
              />
            </div>
            <div className="mt-3.5">
              <Input 
                label="Description & Itemization" 
                name="description" 
                value={formData.description} 
                onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
                placeholder="Monthly factory electric meter reading 4500 units" 
              />
            </div>
          </div>

          <div className="p-3.5 bg-navy-50/70 border border-navy-100 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                id="isRecurring"
                checked={formData.isRecurring}
                onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                className="w-4 h-4 rounded border-navy-300 text-navy-800 focus:ring-navy-600"
              />
              <label htmlFor="isRecurring" className="text-xs font-semibold text-navy-900 cursor-pointer">
                Recurring Operating Liability
              </label>
            </div>
            {formData.isRecurring && (
              <Input
                label="Recurrence Cadence"
                name="recurringFrequency"
                value={formData.recurringFrequency}
                onChange={(e) => setFormData({ ...formData, recurringFrequency: e.target.value })}
                placeholder="Monthly, Bi-weekly, Annual"
              />
            )}
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-navy-100">
            <Button type="button" variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="primary"
              loading={submitting || createMutation.isPending || updateMutation.isPending}
            >
              {editingExpense ? 'Update Expense' : 'Record Expense'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Expenses;
