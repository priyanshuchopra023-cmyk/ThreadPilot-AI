import React, { useState, useCallback } from 'react';
import { 
  Search, 
  CreditCard, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  ArrowDownLeft, 
  ArrowUpRight, 
  User, 
  Truck, 
  FileText, 
  DollarSign,
  CheckCircle2,
  AlertCircle
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
import { paymentApi, customerApi, supplierApi, invoiceApi } from '../api/endpoints';
import type { Payment, PaginatedResponse, Customer, Supplier, SupplierInvoice } from '../types';
import toast from 'react-hot-toast';

const typeOptions = [
  { value: 'CUSTOMER_PAYMENT', label: 'Customer Payment (Inbound)' },
  { value: 'SUPPLIER_PAYMENT', label: 'Supplier Payment (Outbound)' },
  { value: 'REFUND', label: 'Refund' },
  { value: 'ADJUSTMENT', label: 'Adjustment' },
];

const methodOptions = [
  { value: 'CASH', label: 'Cash' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer (NEFT/RTGS)' },
  { value: 'UPI', label: 'UPI / QR' },
  { value: 'CARD', label: 'Corporate Card' },
  { value: 'CHEQUE', label: 'Cheque' },
  { value: 'ONLINE', label: 'Online Payment Gateway' },
  { value: 'OTHER', label: 'Other' },
];

const initialFormData = {
  paymentType: 'CUSTOMER_PAYMENT',
  paymentMethod: 'BANK_TRANSFER',
  paymentDate: new Date().toISOString().split('T')[0],
  amount: 0,
  referenceNumber: '',
  notes: '',
  customerId: '',
  supplierId: '',
  supplierInvoiceId: '',
  customerOrderId: '',
};

type PaymentFormData = typeof initialFormData;

export const Payments: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showModal, setShowModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [viewingPayment, setViewingPayment] = useState<Payment | null>(null);
  const [formData, setFormData] = useState<PaymentFormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [invoices, setInvoices] = useState<SupplierInvoice[]>([]);

  const { data, isLoading, error } = useQuery<Payment[]>({
    queryKey: ['payments', page, pageSize, search, typeFilter],
    queryFn: async () => {
      const res = await paymentApi.list({ page, size: pageSize, type: typeFilter });
      const pageData = res.data as PaginatedResponse<Payment> | undefined;
      return pageData?.content || [];
    },
  });

  const fetchCustomers = useCallback(async () => {
    try {
      const res = await customerApi.list({ page: 1, size: 100 });
      setCustomers((res.data as unknown as PaginatedResponse<Customer>).content || []);
    } catch {
      // ignore
    }
  }, []);

  const fetchSuppliers = useCallback(async () => {
    try {
      const res = await supplierApi.list({ page: 1, size: 100 });
      setSuppliers((res.data as unknown as PaginatedResponse<Supplier>).content || []);
    } catch {
      // ignore
    }
  }, []);

  const fetchInvoices = useCallback(async () => {
    try {
      const res = await invoiceApi.list({ page: 1, size: 100, status: 'VERIFIED' });
      setInvoices((res.data as unknown as PaginatedResponse<SupplierInvoice>).content || []);
    } catch {
      // ignore
    }
  }, []);

  React.useEffect(() => {
    fetchCustomers();
    fetchSuppliers();
    fetchInvoices();
  }, [fetchCustomers, fetchSuppliers, fetchInvoices]);

  const createMutation = useMutation({
    mutationFn: (payload: {
      paymentType: 'CUSTOMER_PAYMENT' | 'SUPPLIER_PAYMENT';
      paymentMethod: string;
      paymentDate: string;
      amount: number;
      referenceNumber?: string;
      notes?: string;
      customer?: { id: string };
      supplier?: { id: string };
      supplierInvoice?: { id: string };
      customerOrder?: { id: string };
    }) => {
      if (payload.paymentType === 'CUSTOMER_PAYMENT') {
        return paymentApi.recordCustomerPayment({
          ...payload,
          customer: payload.customer ? { id: payload.customer.id } : { id: '' },
        });
      } else {
        return paymentApi.recordSupplierPayment({
          ...payload,
          supplier: payload.supplier ? { id: payload.supplier.id } : { id: '' },
        });
      }
    },
    onSuccess: () => {
      toast.success('Payment recorded successfully');
      closeModal();
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : 'Failed to record payment');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data: updateData }: { id: string; data: Partial<Payment> }) => 
      paymentApi.update(id, updateData),
    onSuccess: () => {
      toast.success('Payment updated successfully');
      closeModal();
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : 'Failed to update payment');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => paymentApi.delete(id),
    onSuccess: () => {
      toast.success('Payment record removed and ledger balances adjusted');
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: () => toast.error('Failed to delete payment'),
  });

  const validateForm = useCallback(() => {
    const errors: Record<string, string> = {};
    if (formData.amount <= 0) errors.amount = 'Amount must be greater than 0';
    if (!formData.paymentDate) errors.paymentDate = 'Payment date is required';
    if (formData.paymentType === 'CUSTOMER_PAYMENT' && !formData.customerId) {
      errors.customerId = 'Customer is required for inbound receipts';
    }
    if (formData.paymentType === 'SUPPLIER_PAYMENT' && !formData.supplierId) {
      errors.supplierId = 'Supplier is required for outbound payments';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    if (editingPayment) {
      const payload = {
        paymentDate: formData.paymentDate,
        paymentMethod: formData.paymentMethod as any,
        referenceNumber: formData.referenceNumber,
        notes: formData.notes,
      };
      updateMutation.mutate({ id: editingPayment.id, data: payload }, {
        onSettled: () => setSubmitting(false)
      });
    } else {
      const payload = {
        paymentType: formData.paymentType as 'CUSTOMER_PAYMENT' | 'SUPPLIER_PAYMENT',
        paymentMethod: formData.paymentMethod,
        paymentDate: formData.paymentDate,
        amount: Number(formData.amount),
        referenceNumber: formData.referenceNumber,
        notes: formData.notes,
        customer: formData.paymentType === 'CUSTOMER_PAYMENT' && formData.customerId ? { id: formData.customerId } : undefined,
        supplier: formData.paymentType === 'SUPPLIER_PAYMENT' && formData.supplierId ? { id: formData.supplierId } : undefined,
        supplierInvoice: formData.supplierInvoiceId ? { id: formData.supplierInvoiceId } : undefined,
        customerOrder: formData.customerOrderId ? { id: formData.customerOrderId } : undefined,
      };
      createMutation.mutate(payload, {
        onSettled: () => setSubmitting(false)
      });
    }
  }, [editingPayment, formData, validateForm, createMutation, updateMutation]);

  const openCreateModal = useCallback(() => {
    setEditingPayment(null);
    setViewingPayment(null);
    setFormData({ ...initialFormData, paymentDate: new Date().toISOString().split('T')[0] });
    setFormErrors({});
    setShowModal(true);
  }, []);

  const openEditModal = useCallback((payment: Payment) => {
    setViewingPayment(null);
    setEditingPayment(payment);
    setFormData({
      paymentType: payment.paymentType,
      paymentMethod: payment.paymentMethod,
      paymentDate: payment.paymentDate ? payment.paymentDate.split('T')[0] : '',
      amount: payment.amount,
      referenceNumber: payment.referenceNumber || '',
      notes: payment.notes || '',
      customerId: payment.customerId || '',
      supplierId: payment.supplierId || '',
      supplierInvoiceId: payment.supplierInvoiceId || '',
      customerOrderId: payment.customerOrderId || '',
    });
    setFormErrors({});
    setShowModal(true);
  }, []);

  const openViewModal = useCallback((payment: Payment) => {
    setEditingPayment(null);
    setViewingPayment(payment);
    setShowModal(true);
  }, []);

  const closeModal = useCallback(() => {
    setShowModal(false);
    setEditingPayment(null);
    setViewingPayment(null);
    setFormData(initialFormData);
    setFormErrors({});
  }, []);

  const handleDelete = useCallback((id: string) => {
    if (window.confirm('Are you sure you want to delete this payment? This will reverse the payment effects on outstanding balances.')) {
      deleteMutation.mutate(id);
    }
  }, [deleteMutation]);

  const getEntityName = useCallback((payment: Payment) => {
    if (payment.paymentType === 'CUSTOMER_PAYMENT') {
      return customers.find(c => c.id === payment.customerId)?.name || (payment.customerId ? `${payment.customerId.slice(0, 8)}...` : 'Walk-in');
    }
    return suppliers.find(s => s.id === payment.supplierId)?.name || (payment.supplierId ? `${payment.supplierId.slice(0, 8)}...` : 'Vendor');
  }, [customers, suppliers]);

  if (isLoading && !data) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-navy-100 rounded w-48" />
        <Card><CardBody className="p-6 h-64"><div className="h-4 bg-navy-100 rounded w-1/4 mb-4"/><div className="space-y-3"><div className="h-10 bg-navy-100 rounded"/><div className="h-10 bg-navy-100 rounded"/></div></CardBody></Card>
      </div>
    );
  }

  const payments = data || [];
  const totalItems = data?.length || 0;
  const customerTotal = payments.filter(p => p.paymentType === 'CUSTOMER_PAYMENT').reduce((acc, p) => acc + Number(p.amount || 0), 0);
  const supplierTotal = payments.filter(p => p.paymentType === 'SUPPLIER_PAYMENT').reduce((acc, p) => acc + Number(p.amount || 0), 0);
  const netCashflow = customerTotal - supplierTotal;

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Payments"
        subtitle="Customer collection receipts, vendor settlement vouchers, and multi-mode payment ledger"
        breadcrumbs={[
          { label: 'Financials' },
          { label: 'Payments' },
        ]}
        actions={
          <Button 
            onClick={openCreateModal} 
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            className="shadow-sm"
          >
            Record Payment
          </Button>
        }
      />

      {/* Cashflow Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white border border-navy-100 rounded-xl shadow-card flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-success-50 text-success-700 flex items-center justify-center flex-shrink-0">
            <ArrowDownLeft className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-navy-500">Customer Receipts (In)</p>
            <p className="text-xl font-bold text-success-800 font-mono tabular-nums">
              +₹{customerTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <div className="p-4 bg-white border border-navy-100 rounded-xl shadow-card flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-danger-50 text-danger-700 flex items-center justify-center flex-shrink-0">
            <ArrowUpRight className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-navy-500">Supplier Payouts (Out)</p>
            <p className="text-xl font-bold text-danger-800 font-mono tabular-nums">
              -₹{supplierTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <div className="p-4 bg-white border border-navy-100 rounded-xl shadow-card flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-navy-50 text-navy-700 flex items-center justify-center flex-shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-navy-500">Net Operating Flow</p>
            <p className={`text-xl font-bold font-mono tabular-nums ${netCashflow >= 0 ? 'text-navy-900' : 'text-danger-800'}`}>
              {netCashflow >= 0 ? '+' : ''}₹{netCashflow.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
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
                placeholder="Search payment vouchers or references..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-9 bg-navy-50/40"
              />
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={typeFilter}
                onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
                options={[{ value: '', label: 'All Payment Types' }, ...typeOptions]}
                placeholder="Filter by type"
                className="w-full sm:w-56"
              />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Table Card */}
      <Card className="overflow-hidden">
        <CardBody className="p-0">
          {error ? (
            <div className="p-8 text-center text-danger-600 font-medium text-sm">Failed to load payment transactions</div>
          ) : (
            <DataTable<Payment>
              data={payments}
              columns={[
                { 
                  key: 'paymentNumber', 
                  header: 'Voucher #', 
                  width: '130px',
                  render: (row: Payment) => (
                    <span className="font-mono text-xs font-semibold text-navy-900">
                      {row.paymentNumber}
                    </span>
                  )
                },
                { 
                  key: 'paymentDate', 
                  header: 'Date', 
                  width: '110px', 
                  render: (row) => <span className="font-mono text-xs text-navy-600">{new Date(row.paymentDate).toLocaleDateString()}</span> 
                },
                {
                  key: 'paymentType',
                  header: 'Type',
                  width: '160px',
                  render: (row: Payment) => (
                    <Badge 
                      variant={row.paymentType === 'CUSTOMER_PAYMENT' ? 'success' : row.paymentType === 'SUPPLIER_PAYMENT' ? 'brass' : 'warning'}
                      size="sm"
                    >
                      {row.paymentType === 'CUSTOMER_PAYMENT' ? (
                        <ArrowDownLeft className="w-3 h-3 mr-1 inline" />
                      ) : (
                        <ArrowUpRight className="w-3 h-3 mr-1 inline" />
                      )}
                      {row.paymentType === 'CUSTOMER_PAYMENT' ? 'Customer In' : 'Supplier Out'}
                    </Badge>
                  ),
                },
                {
                  key: 'paymentMethod',
                  header: 'Method',
                  width: '130px',
                  render: (row) => (
                    <Badge variant="secondary" size="sm" className="font-mono text-[10px]">
                      {row.paymentMethod.replace(/_/g, ' ')}
                    </Badge>
                  )
                },
                {
                  key: 'amount',
                  header: 'Amount',
                  align: 'right',
                  width: '130px',
                  render: (row) => (
                    <span className={`font-mono text-xs font-bold tabular-nums ${
                      row.paymentType === 'CUSTOMER_PAYMENT' ? 'text-success-700' : 'text-danger-700'
                    }`}>
                      {row.paymentType === 'CUSTOMER_PAYMENT' ? '+' : '-'}₹{Number(row.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  ),
                },
                {
                  key: 'entity',
                  header: 'Party / Account',
                  render: (row) => (
                    <div className="flex items-center gap-1.5 text-xs text-navy-800">
                      {row.paymentType === 'CUSTOMER_PAYMENT' ? (
                        <User className="w-3.5 h-3.5 text-navy-400" />
                      ) : (
                        <Truck className="w-3.5 h-3.5 text-navy-400" />
                      )}
                      <span className="font-medium truncate max-w-[150px]">{getEntityName(row)}</span>
                    </div>
                  ),
                },
                {
                  key: 'referenceNumber',
                  header: 'Ref / Cheque #',
                  width: '140px',
                  render: (row) => (
                    <span className="font-mono text-[11px] text-navy-500 truncate block">
                      {row.referenceNumber || '—'}
                    </span>
                  )
                },
                {
                  key: 'actions',
                  header: '',
                  width: '110px',
                  align: 'center',
                  render: (row) => (
                    <div className="flex items-center justify-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => openViewModal(row)} 
                        aria-label="View payment"
                        className="text-navy-600 hover:text-navy-900 p-1.5 h-7 w-7"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => openEditModal(row)} 
                        aria-label="Edit payment"
                        className="text-navy-600 hover:text-navy-900 p-1.5 h-7 w-7"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDelete(row.id)} 
                        aria-label="Delete payment" 
                        className="text-danger-600 hover:text-danger-700 hover:bg-danger-50 p-1.5 h-7 w-7"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ),
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
              emptyMessage="No payment records found"
            />
          )}
        </CardBody>
      </Card>

      {/* Modal for View / Create / Edit */}
      <Modal
        isOpen={showModal && (!!editingPayment || !!viewingPayment)}
        onClose={closeModal}
        title={viewingPayment ? `Payment Voucher: ${viewingPayment.paymentNumber}` : editingPayment ? 'Edit Payment Voucher' : 'Record Payment Voucher'}
        size="lg"
      >
        {viewingPayment ? (
          <div className="space-y-4 max-h-[72vh] overflow-y-auto px-1 py-1">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-navy-50/70 border border-navy-100 rounded-xl">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-navy-500">Voucher</p>
                <p className="font-mono text-xs font-bold text-navy-900 mt-0.5">{viewingPayment.paymentNumber}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-navy-500">Date</p>
                <p className="font-mono text-xs text-navy-700 mt-0.5">{new Date(viewingPayment.paymentDate).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-navy-500">Party</p>
                <p className="text-xs font-bold text-navy-900 mt-0.5 truncate">{getEntityName(viewingPayment)}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-navy-500">Method</p>
                <Badge variant="secondary" size="sm" className="mt-0.5 font-mono text-[10px]">
                  {viewingPayment.paymentMethod}
                </Badge>
              </div>
            </div>

            <div className="p-4 bg-white border border-navy-100 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-navy-500">Voucher Amount</p>
                <p className={`text-2xl font-bold font-mono tabular-nums mt-1 ${
                  viewingPayment.paymentType === 'CUSTOMER_PAYMENT' ? 'text-success-700' : 'text-danger-700'
                }`}>
                  {viewingPayment.paymentType === 'CUSTOMER_PAYMENT' ? '+' : '-'}₹{Number(viewingPayment.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <Badge variant={viewingPayment.paymentType === 'CUSTOMER_PAYMENT' ? 'success' : 'brass'} size="md">
                {viewingPayment.paymentType.replace(/_/g, ' ')}
              </Badge>
            </div>

            {viewingPayment.referenceNumber && (
              <div className="p-3 bg-navy-50/50 rounded-lg border border-navy-100">
                <p className="text-[11px] font-semibold text-navy-500 uppercase tracking-wider">Bank Reference / UTR</p>
                <p className="font-mono text-xs text-navy-900 mt-0.5">{viewingPayment.referenceNumber}</p>
              </div>
            )}

            {viewingPayment.notes && (
              <div className="p-3 bg-navy-50/50 rounded-lg border border-navy-100">
                <p className="text-[11px] font-semibold text-navy-500 uppercase tracking-wider">Voucher Remarks</p>
                <p className="text-xs text-navy-700 mt-0.5">{viewingPayment.notes}</p>
              </div>
            )}

            <div className="flex justify-end gap-2.5 pt-4 border-t border-navy-100">
              <Button type="button" variant="secondary" onClick={closeModal}>
                Close
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 max-h-[72vh] overflow-y-auto px-1 py-1">
            {editingPayment ? (
              <div className="bg-navy-50/70 border border-navy-100 rounded-xl p-3.5 text-xs text-navy-600">
                <strong>Note:</strong> Modifying recorded settlement details. Financial amount and party entity are immutable for ledger auditability.
              </div>
            ) : (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-navy-500 mb-2">
                  Transaction Classification
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <Select
                    label="Transaction Flow *"
                    name="paymentType"
                    value={formData.paymentType}
                    onChange={(e) => setFormData({ ...formData, paymentType: e.target.value })}
                    options={typeOptions}
                  />
                  <Input
                    label="Payment Amount (₹) *"
                    name="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                    error={formErrors.amount}
                    placeholder="0.00"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-3.5">
                  {formData.paymentType === 'CUSTOMER_PAYMENT' ? (
                    <Select
                      label="Customer Account *"
                      name="customerId"
                      value={formData.customerId}
                      onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                      options={[
                        { value: '', label: 'Select customer...' },
                        ...customers.map(c => ({ value: c.id, label: `${c.name} (${c.businessName || 'Retail'})` }))
                      ]}
                      error={formErrors.customerId}
                    />
                  ) : (
                    <Select
                      label="Supplier Account *"
                      name="supplierId"
                      value={formData.supplierId}
                      onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                      options={[
                        { value: '', label: 'Select supplier...' },
                        ...suppliers.map(s => ({ value: s.id, label: `${s.name} (${s.companyName || 'Vendor'})` }))
                      ]}
                      error={formErrors.supplierId}
                    />
                  )}
                  <Select
                    label="Settlement Method *"
                    name="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    options={methodOptions}
                  />
                </div>
              </div>
            )}

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-navy-500 mb-2">
                Settlement Details & Reference
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <Input
                  label="Voucher Date *"
                  name="paymentDate"
                  type="date"
                  value={formData.paymentDate}
                  onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                  error={formErrors.paymentDate}
                />
                <Input
                  label="Reference / Cheque / UTR #"
                  name="referenceNumber"
                  value={formData.referenceNumber}
                  onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                  placeholder="UTR202410240091"
                />
              </div>
              <div className="mt-3.5">
                <Input
                  label="Ledger Notes & Remarks"
                  name="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Invoice settlement notes, bank clearance remarks..."
                />
              </div>
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
                {editingPayment ? 'Update Voucher' : 'Record Voucher'}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default Payments;
