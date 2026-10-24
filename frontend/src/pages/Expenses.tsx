import React, { useState, FormEvent } from 'react';
import { Search, Filter, Receipt, Plus, Edit, Trash2, Eye, ChevronDown, Download } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { DataTable } from '../components/tables/DataTable';
import { Badge } from '../components/ui/Badge';
import { expenseApi } from '../api/endpoints';
import type { Expense, PaginatedResponse } from '../types';
import toast from 'react-hot-toast';

const categoryOptions = [
  { value: 'RENT', label: 'Rent' },
  { value: 'UTILITIES', label: 'Utilities' },
  { value: 'SALARIES', label: 'Salaries' },
  { value: 'MARKETING', label: 'Marketing' },
  { value: 'TRAVEL', label: 'Travel' },
  { value: 'OFFICE_SUPPLIES', label: 'Office Supplies' },
  { value: 'EQUIPMENT', label: 'Equipment' },
  { value: 'SOFTWARE', label: 'Software' },
  { value: 'INSURANCE', label: 'Insurance' },
  { value: 'LEGAL', label: 'Legal' },
  { value: 'ACCOUNTING', label: 'Accounting' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'SHIPPING', label: 'Shipping' },
  { value: 'PACKAGING', label: 'Packaging' },
  { value: 'OTHER', label: 'Other' },
];

const methodOptions = [
  { value: 'CASH', label: 'Cash' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
  { value: 'UPI', label: 'UPI' },
  { value: 'CARD', label: 'Card' },
  { value: 'CHEQUE', label: 'Cheque' },
  { value: 'ONLINE', label: 'Online' },
  { value: 'OTHER', label: 'Other' },
];

const initialFormData = {
  category: 'OTHER',
  expenseDate: new Date().toISOString().split('T')[0],
  amount: 0,
  paymentMethod: 'CASH',
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
    mutationFn: (data: Partial<Expense>) => expenseApi.create(data),
    onSuccess: () => {
      toast.success('Expense recorded successfully');
      closeModal();
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Failed to record expense');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Expense> }) => expenseApi.update(id, data),
    onSuccess: () => {
      toast.success('Expense updated successfully');
      closeModal();
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Failed to update expense');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => expenseApi.delete(id),
    onSuccess: () => {
      toast.success('Expense deleted');
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
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
    const data = { ...formData, amount: Number(formData.amount) } as Partial<Expense>;

    if (editingExpense) {
      updateMutation.mutate({ id: editingExpense.id, data });
    } else {
      createMutation.mutate(data);
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
      expenseDate: expense.expenseDate.split('T')[0],
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
    if (window.confirm('Are you sure you want to delete this expense?')) {
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

  const expenses = data || [];
  const totalItems = data?.length || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 flex items-center gap-2">
            <Receipt className="w-6 h-6 text-primary-600" />
            Expenses
          </h1>
          <p className="text-secondary-600 mt-1">Track business expenses</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" leftIcon={<Download className="w-4 h-4" />}>Export</Button>
          <Button onClick={openCreateModal} leftIcon={<Plus className="w-4 h-4" />}>
            Add Expense
          </Button>
        </div>
      </div>

      <Card>
        <CardBody className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400 w-5 h-5" />
              <Input
                placeholder="Search expenses..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-10"
              />
            </div>
            <Select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
              options={[{ value: '', label: 'All Categories' }, ...categoryOptions]}
              placeholder="Filter by category"
              className="w-full sm:w-48"
            />
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
            <div className="p-6 text-center text-red-600">Failed to load expenses</div>
          ) : (
            <DataTable<Expense>
              data={expenses}
              columns={[
                { key: 'expenseNumber', header: 'Expense #', width: '130px' },
                { key: 'expenseDate', header: 'Date', width: '110px' },
                { key: 'category', header: 'Category', width: '140px', render: (row: Expense) => <Badge variant="info">{row.category.replace(/_/g, ' ')}</Badge> },
                { key: 'vendorName', header: 'Vendor', width: '150px' },
                { key: 'amount', header: 'Amount', align: 'right', width: '120px', render: (row: Expense) => `₹${Number(row.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` },
                { key: 'paymentMethod', header: 'Method', width: '130px', render: (row: Expense) => <Badge variant="secondary">{row.paymentMethod.replace(/_/g, ' ')}</Badge> },
                { key: 'referenceNumber', header: 'Reference', width: '130px' },
                { key: 'isRecurring', header: 'Recurring', align: 'center', width: '90px', render: (row: Expense) => (
                  <Badge variant={row.isRecurring ? 'success' : 'secondary'}>
                    {row.isRecurring ? 'Yes' : 'No'}
                  </Badge>
                )},
                { key: 'approved', header: 'Approved', align: 'center', width: '90px', render: (row) => (
                  <Badge variant={row.approved ? 'success' : 'warning'}>
                    {row.approved ? 'Yes' : 'Pending'}
                  </Badge>
                )},
                { key: 'actions', header: 'Actions', width: '120px', render: (row) => (
                  <div className="flex items-center justify-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => openEditModal(row)} aria-label="Edit expense">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(row.id)} aria-label="Delete expense" className="text-red-600 hover:bg-red-50">
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
              emptyMessage="No expenses found"
            />
          )}
        </CardBody>
      </Card>

      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editingExpense ? 'Edit Expense' : 'Add Expense'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <Select label="Category *" name="category" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} options={categoryOptions} placeholder="Select category" />
            <Input label="Expense Date *" name="expenseDate" type="date" value={formData.expenseDate} onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })} error={formErrors.expenseDate} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Amount *" name="amount" type="number" step="0.01" min="0.01" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })} error={formErrors.amount} placeholder="0.00" />
            <Select label="Payment Method *" name="paymentMethod" value={formData.paymentMethod} onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })} options={methodOptions} placeholder="Select method" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Vendor Name" name="vendorName" value={formData.vendorName} onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })} placeholder="Vendor name" />
            <Input label="Reference Number" name="referenceNumber" value={formData.referenceNumber} onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })} placeholder="Invoice/Bill reference" />
          </div>
          <Input label="Description" name="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Expense description" />
          <Input label="Receipt URL" name="receiptUrl" value={formData.receiptUrl} onChange={(e) => setFormData({ ...formData, receiptUrl: e.target.value })} placeholder="https://example.com/receipt.jpg" />
          <div className="grid grid-cols-2 gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isRecurring}
                onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                className="w-4 h-4 rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm font-medium text-secondary-700">Recurring Expense</span>
            </label>
            <Input
              label="Recurring Frequency"
              name="recurringFrequency"
              value={formData.recurringFrequency}
              onChange={(e) => setFormData({ ...formData, recurringFrequency: e.target.value })}
              placeholder="Monthly, Quarterly, etc."
              disabled={!formData.isRecurring}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-secondary-200">
            <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button type="submit" loading={submitting || createMutation.isPending || updateMutation.isPending}>
              {editingExpense ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};