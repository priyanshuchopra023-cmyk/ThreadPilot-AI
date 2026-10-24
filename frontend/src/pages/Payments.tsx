import React, { useState, FormEvent, useCallback } from 'react';
import { Search, Filter, CreditCard, Plus, Edit, Trash2, Eye, ChevronDown, ArrowDownLeft, ArrowUpRight, Download, User, Truck, FileText, DollarSign } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { DataTable } from '../components/tables/DataTable';
import { Badge } from '../components/ui/Badge';
import { paymentApi, customerApi, supplierApi, invoiceApi } from '../api/endpoints';
import type { Payment, PaginatedResponse, Customer, Supplier, SupplierInvoice } from '../types';
import toast from 'react-hot-toast';

const typeOptions = [
  { value: 'CUSTOMER_PAYMENT', label: 'Customer Payment' },
  { value: 'SUPPLIER_PAYMENT', label: 'Supplier Payment' },
  { value: 'REFUND', label: 'Refund' },
  { value: 'ADJUSTMENT', label: 'Adjustment' },
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
  paymentType: 'CUSTOMER_PAYMENT',
  paymentMethod: 'CASH',
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

const formatCurrency = (value: number) => `₹${Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString();

const getTypeBadgeVariant = (type: string) => {
  switch (type) {
    case 'CUSTOMER_PAYMENT': return 'success';
    case 'SUPPLIER_PAYMENT': return 'info';
    case 'REFUND': return 'warning';
    default: return 'secondary';
  }
};

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'CUSTOMER_PAYMENT': return <ArrowDownLeft className="w-4 h-4 inline mr-1" />;
    case 'SUPPLIER_PAYMENT': return <ArrowUpRight className="w-4 h-4 inline mr-1" />;
    default: return <DollarSign className="w-4 h-4 inline mr-1" />;
  }
};

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

  const { data, isLoading, error, refetch } = useQuery<Payment[]>({
    queryKey: ['payments', page, pageSize, search, typeFilter],
    queryFn: async () => {
      const res = await paymentApi.list({ page, size: pageSize, type: typeFilter });
      return (res.data as unknown) as Payment[];
    },
  });

  const fetchCustomers = useCallback(async () => {
    try {
      const res = await customerApi.list({ page: 1, size: 100 });
      setCustomers((res.data as unknown as PaginatedResponse<Customer>).content);
    } catch {
      // ignore
    }
  }, []);

  const fetchSuppliers = useCallback(async () => {
    try {
      const res = await supplierApi.list({ page: 1, size: 100 });
      setSuppliers((res.data as unknown as PaginatedResponse<Supplier>).content);
    } catch {
      // ignore
    }
  }, []);

  const fetchInvoices = useCallback(async () => {
    try {
      const res = await invoiceApi.list({ page: 1, size: 100, status: 'VERIFIED' });
      setInvoices((res.data as unknown as PaginatedResponse<SupplierInvoice>).content);
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
    mutationFn: (data: {
      paymentType: 'CUSTOMER_PAYMENT' | 'SUPPLIER_PAYMENT';
      paymentMethod: string;
      paymentDate: string;
      amount: number;
      referenceNumber?: string;
      notes?: string;
      customer: { id: string };
      supplier?: { id: string };
      supplierInvoice?: { id: string };
      customerOrder?: { id: string };
    }) => {
      if (data.paymentType === 'CUSTOMER_PAYMENT') {
        return paymentApi.recordCustomerPayment(data as { paymentType: string; paymentMethod: string; paymentDate: string; amount: number; referenceNumber?: string; notes?: string; customer: { id: string }; customerOrder?: { id: string } });
      } else {
        return paymentApi.recordSupplierPayment(data as { paymentType: string; paymentMethod: string; paymentDate: string; amount: number; referenceNumber?: string; notes?: string; supplier: { id: string }; supplierInvoice?: { id: string } });
      }
    },
    onSuccess: () => {
      toast.success('Payment recorded successfully');
      closeModal();
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Failed to record payment');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Payment> }) => paymentApi.update(id, data),
    onSuccess: () => {
      toast.success('Payment updated successfully');
      closeModal();
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Failed to update payment');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => paymentApi.delete(id),
    onSuccess: () => {
      toast.success('Payment deleted');
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
    if (formData.paymentType === 'CUSTOMER_PAYMENT' && !formData.customerId) errors.customerId = 'Customer is required for customer payments';
    if (formData.paymentType === 'SUPPLIER_PAYMENT' && !formData.supplierId) errors.supplierId = 'Supplier is required for supplier payments';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    if (editingPayment) {
      // For updates, only send editable fields
      const data = {
        paymentDate: formData.paymentDate,
        paymentMethod: formData.paymentMethod as 'CASH' | 'BANK_TRANSFER' | 'UPI' | 'CARD' | 'CHEQUE' | 'ONLINE' | 'OTHER',
        referenceNumber: formData.referenceNumber,
        notes: formData.notes,
      };
      updateMutation.mutate({ id: editingPayment.id, data });
    } else {
      // For creation, send all required fields
      const data = {
        paymentType: formData.paymentType as 'CUSTOMER_PAYMENT' | 'SUPPLIER_PAYMENT',
        paymentMethod: formData.paymentMethod as 'CASH' | 'BANK_TRANSFER' | 'UPI' | 'CARD' | 'CHEQUE' | 'ONLINE' | 'OTHER',
        paymentDate: formData.paymentDate,
        amount: Number(formData.amount),
        referenceNumber: formData.referenceNumber,
        notes: formData.notes,
        customer: formData.paymentType === 'CUSTOMER_PAYMENT' && formData.customerId ? { id: formData.customerId } : undefined,
        supplier: formData.paymentType === 'SUPPLIER_PAYMENT' && formData.supplierId ? { id: formData.supplierId } : undefined,
        supplierInvoice: formData.supplierInvoiceId ? { id: formData.supplierInvoiceId } : undefined,
        customerOrder: formData.customerOrderId ? { id: formData.customerOrderId } : undefined,
      };
      createMutation.mutate(data as { paymentType: 'CUSTOMER_PAYMENT' | 'SUPPLIER_PAYMENT'; paymentMethod: string; paymentDate: string; amount: number; referenceNumber?: string; notes?: string; customer: { id: string }; supplier?: { id: string }; supplierInvoice?: { id: string }; customerOrder?: { id: string } });
    }
  }, [editingPayment, formData, validateForm]);

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
      paymentDate: payment.paymentDate.split('T')[0],
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
  }, []);

  const getEntityName = useCallback((payment: Payment) => {
    if (payment.paymentType === 'CUSTOMER_PAYMENT') {
      return customers.find(c => c.id === payment.customerId)?.name || payment.customerId?.slice(0, 8) + '...' || '—';
    }
    return suppliers.find(s => s.id === payment.supplierId)?.name || payment.supplierId?.slice(0, 8) + '...' || '—';
  }, [customers, suppliers]);

  const getEntityType = useCallback((payment: Payment) => {
    return payment.paymentType === 'CUSTOMER_PAYMENT' ? 'Customer' : 'Supplier';
  }, []);

  const getLinkedDoc = useCallback((payment: Payment) => {
    if (payment.supplierInvoiceId) return { id: payment.supplierInvoiceId, type: 'Invoice' };
    if (payment.customerOrderId) return { id: payment.customerOrderId, type: 'Order' };
    return null;
  }, []);

  if (isLoading && !data) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-8 bg-secondary-200 rounded w-48" />
          <div className="h-10 bg-secondary-200 rounded w-32" />
        </div>
        <Card>
          <CardBody className="p-6 h-64">
            <div className="h-4 bg-secondary-200 rounded w-1/4 mb-4" />
            <div className="space-y-3">
              <div className="h-10 bg-secondary-200 rounded" />
              <div className="h-10 bg-secondary-200 rounded" />
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  const payments = data || [];
  const totalItems = data?.length || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-primary-600" />
            Payments
          </h1>
          <p className="text-secondary-600 mt-1">Track all payments received and made</p>
        </div>
        <Button onClick={openCreateModal} leftIcon={<Plus className="w-4 h-4" />}>
          Record Payment
        </Button>
      </div>

      <Card>
        <CardBody className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400 w-5 h-5" />
              <Input
                placeholder="Search payments..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-10"
              />
            </div>
            <Select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
              options={[{ value: '', label: 'All Types' }, ...typeOptions]}
              placeholder="Filter by type"
              className="w-full sm:w-48"
            />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="p-0">
          {error ? (
            <div className="p-6 text-center text-red-600">Failed to load payments</div>
          ) : (
            <DataTable<Payment>
              data={payments}
              columns={[
                { key: 'paymentNumber', header: 'Payment #', width: '130px' },
                { key: 'paymentDate', header: 'Date', width: '110px', render: (row) => formatDate(row.paymentDate) },
                {
                  key: 'paymentType',
                  header: 'Type',
                  width: '150px',
                  render: (row: Payment) => (
                    <Badge variant={getTypeBadgeVariant(row.paymentType)}>
                      {getTypeIcon(row.paymentType)}
                      {row.paymentType.replace(/_/g, ' ')}
                    </Badge>
                  ),
                },
                {
                  key: 'paymentMethod',
                  header: 'Method',
                  width: '130px',
                  render: (row) => <Badge variant="secondary">{row.paymentMethod.replace(/_/g, ' ')}</Badge>
                },
                {
                  key: 'amount',
                  header: 'Amount',
                  align: 'right',
                  width: '120px',
                  render: (row) => (
                    <span className={row.paymentType === 'CUSTOMER_PAYMENT' ? 'text-green-600' : 'text-red-600'}>
                      {getTypeIcon(row.paymentType)}
                      {formatCurrency(row.amount)}
                    </span>
                  ),
                },
                {
                  key: 'entity',
                  header: 'Customer / Supplier',
                  width: '150px',
                  render: (row) => (
                    <div className="flex items-center gap-2">
                      {row.paymentType === 'CUSTOMER_PAYMENT' ? <User className="w-4 h-4 text-secondary-500" /> : <Truck className="w-4 h-4 text-secondary-500" />}
                      <span className="font-mono text-xs text-secondary-700">{getEntityName(row)}</span>
                    </div>
                  ),
                },
                {
                  key: 'linkedDoc',
                  header: 'Linked Doc',
                  width: '140px',
                  render: (row) => {
                    const linked = getLinkedDoc(row);
                    if (!linked) return <span className="text-secondary-400">—</span>;
                    return (
                      <span className="cursor-pointer inline-flex items-center gap-1" onClick={() => { /* navigate to doc */ }}>
                        <Badge variant="info" className="cursor-pointer">
                          <FileText className="w-3 h-3 mr-1" />
                          {linked.type} {linked.id.slice(0, 8)}...
                        </Badge>
                      </span>
                    );
                  },
                },
                {
                  key: 'reconciled',
                  header: 'Reconciled',
                  align: 'center',
                  width: '100px',
                  render: (row) => (
                    <Badge variant={row.reconciled ? 'success' : 'warning'}>
                      {row.reconciled ? 'Yes' : 'No'}
                    </Badge>
                  ),
                },
                {
                  key: 'actions',
                  header: 'Actions',
                  width: '120px',
                  render: (row) => (
                    <div className="flex items-center justify-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openViewModal(row)} aria-label="View payment">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openEditModal(row)} aria-label="Edit payment">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(row.id)} aria-label="Delete payment" className="text-red-600 hover:bg-red-50">
                        <Trash2 className="w-4 h-4" />
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
              emptyMessage="No payments found"
            />
          )}
        </CardBody>
      </Card>

      <Modal
        isOpen={showModal && (!!editingPayment || !!viewingPayment)}
        onClose={closeModal}
        title={viewingPayment ? `Payment: ${viewingPayment.paymentNumber}` : editingPayment ? 'Edit Payment' : 'Record Payment'}
        size="lg"
      >
        {viewingPayment ? (
          <div className="space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Payment Number</label>
                <p className="font-mono text-secondary-900">{viewingPayment.paymentNumber}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Date</label>
                <p className="text-secondary-900">{formatDate(viewingPayment.paymentDate)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Type</label>
                <Badge variant={getTypeBadgeVariant(viewingPayment.paymentType)}>
                  {getTypeIcon(viewingPayment.paymentType)}
                  {viewingPayment.paymentType.replace(/_/g, ' ')}
                </Badge>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Method</label>
                <Badge variant="secondary">{viewingPayment.paymentMethod.replace(/_/g, ' ')}</Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Input label="Amount" type="number" step="0.01" value={viewingPayment.amount} disabled className={`bg-secondary-50 font-bold ${viewingPayment.paymentType === 'CUSTOMER_PAYMENT' ? 'text-green-600' : 'text-red-600'}`} />
              <Input label="Reference" value={viewingPayment.referenceNumber || '—'} disabled className="bg-secondary-50" />
              {viewingPayment.customerId && (
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Customer</label>
                  <p className="text-secondary-900">{customers.find(c => c.id === viewingPayment.customerId)?.name || viewingPayment.customerId}</p>
                </div>
              )}
              {viewingPayment.supplierId && (
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Supplier</label>
                  <p className="text-secondary-900">{suppliers.find(s => s.id === viewingPayment.supplierId)?.name || viewingPayment.supplierId}</p>
                </div>
              )}
            </div>

            {viewingPayment.supplierInvoiceId && (
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Linked Invoice</label>
                <p className="font-mono text-xs text-secondary-700">{viewingPayment.supplierInvoiceId}</p>
              </div>
            )}

            {viewingPayment.customerOrderId && (
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Linked Order</label>
                <p className="font-mono text-xs text-secondary-700">{viewingPayment.customerOrderId}</p>
              </div>
            )}

            {viewingPayment.notes && (
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Notes</label>
                <p className="text-secondary-600">{viewingPayment.notes}</p>
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <label className="block text-sm font-medium text-secondary-700 mb-1">Reconciled</label>
              <Badge variant={viewingPayment.reconciled ? 'success' : 'warning'}>
                {viewingPayment.reconciled ? 'Yes' : 'No'}
              </Badge>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-secondary-200">
              <Button type="button" variant="secondary" onClick={closeModal}>Close</Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="bg-secondary-50 border border-secondary-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-secondary-700">
                <strong>Note:</strong> Only payment date, method, reference number, and notes can be edited.
                Payment type, amount, customer/supplier, and linked records cannot be changed.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Payment Method *"
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                options={methodOptions}
                placeholder="Select method"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Payment Date *"
                name="paymentDate"
                type="date"
                value={formData.paymentDate}
                onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                error={formErrors.paymentDate}
              />
            </div>
            <Input
              label="Reference Number"
              name="referenceNumber"
              value={formData.referenceNumber}
              onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
              placeholder="Cheque/Transaction reference"
            />
            <Input
              label="Notes"
              name="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes"
              className="md:col-span-2"
            />

            <div className="flex justify-end gap-3 pt-4 border-t border-secondary-200">
              <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
              <Button type="submit" loading={submitting || createMutation.isPending || updateMutation.isPending}>
                {editingPayment ? 'Update' : 'Record'}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default Payments;