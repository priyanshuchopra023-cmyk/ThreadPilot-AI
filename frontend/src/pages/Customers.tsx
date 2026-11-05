import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Users, 
  Edit, 
  Trash2, 
  Building2, 
  CreditCard, 
  Phone, 
  Mail, 
  DollarSign 
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
import { customerApi } from '../api/endpoints';
import type { Customer } from '../types';
import toast from 'react-hot-toast';

const statusOptions = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'BLACKLISTED', label: 'Blacklisted' },
  { value: 'ON_HOLD', label: 'On Hold' },
];

const typeOptions = [
  { value: 'RETAILER', label: 'Retailer' },
  { value: 'WHOLESALER', label: 'Wholesaler' },
  { value: 'DISTRIBUTOR', label: 'Distributor' },
  { value: 'EXPORTER', label: 'Exporter' },
  { value: 'OTHER', label: 'Other' },
];

const initialFormData = {
  name: '',
  businessName: '',
  phone: '',
  email: '',
  address: '',
  city: '',
  state: '',
  postalCode: '',
  gstNumber: '',
  panNumber: '',
  customerType: 'RETAILER' as const,
  creditLimit: 0,
  paymentTerms: '',
  status: 'ACTIVE' as const,
  notes: '',
};

export const Customers: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState(initialFormData);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['customers', page, pageSize, search, statusFilter, typeFilter],
    queryFn: () => customerApi.list({ page, size: pageSize, search, status: statusFilter }),
  });

  const createMutation = useMutation({
    mutationFn: (customerData: Partial<Customer>) => customerApi.create(customerData),
    onSuccess: () => {
      toast.success('Customer created successfully');
      closeModal();
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : 'Failed to create customer');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data: updateData }: { id: string; data: Partial<Customer> }) => 
      customerApi.update(id, updateData),
    onSuccess: () => {
      toast.success('Customer updated successfully');
      closeModal();
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : 'Failed to update customer');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => customerApi.delete(id),
    onSuccess: () => {
      toast.success('Customer deleted');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: () => toast.error('Failed to delete customer'),
  });

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = 'Invalid email format';
    if (formData.creditLimit < 0) errors.creditLimit = 'Credit limit cannot be negative';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    const payload = { ...formData, creditLimit: Number(formData.creditLimit) };

    if (editingCustomer) {
      updateMutation.mutate({ id: editingCustomer.id, data: payload }, {
        onSettled: () => setSubmitting(false)
      });
    } else {
      createMutation.mutate(payload, {
        onSettled: () => setSubmitting(false)
      });
    }
  };

  const openCreateModal = () => {
    setEditingCustomer(null);
    setFormData(initialFormData);
    setFormErrors({});
    setShowModal(true);
  };

  const openEditModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      businessName: customer.businessName || '',
      phone: customer.phone || '',
      email: customer.email || '',
      address: customer.address || '',
      city: customer.city || '',
      state: customer.state || '',
      postalCode: customer.postalCode || '',
      gstNumber: customer.gstNumber || '',
      panNumber: customer.panNumber || '',
      customerType: customer.customerType as typeof initialFormData.customerType,
      creditLimit: customer.creditLimit,
      paymentTerms: customer.paymentTerms || '',
      status: customer.status as typeof initialFormData.status,
      notes: customer.notes || '',
    });
    setFormErrors({});
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCustomer(null);
    setFormData(initialFormData);
    setFormErrors({});
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
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

  const customers = data?.data?.content || [];
  const totalItems = data?.data?.totalElements || 0;
  const totalReceivables = customers.reduce((acc: number, c: Customer) => acc + Number(c.outstandingAmount || 0), 0);
  const activeCount = customers.filter((c: Customer) => c.status === 'ACTIVE').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Customers"
        subtitle="Wholesale distributor accounts, retail partner credit limits, and receivable ledgers"
        breadcrumbs={[
          { label: 'Commerce' },
          { label: 'Customers' },
        ]}
        actions={
          <Button 
            onClick={openCreateModal} 
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            className="shadow-sm"
          >
            Add Customer
          </Button>
        }
      />

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white border border-navy-100 rounded-xl shadow-card flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-navy-50 text-navy-700 flex items-center justify-center flex-shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-navy-500">Active Accounts</p>
            <p className="text-xl font-bold text-navy-900 font-mono tabular-nums">{activeCount} / {customers.length}</p>
          </div>
        </div>

        <div className="p-4 bg-white border border-navy-100 rounded-xl shadow-card flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-warning-50 text-warning-700 flex items-center justify-center flex-shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-navy-500">Total Receivables</p>
            <p className="text-xl font-bold text-navy-900 font-mono tabular-nums">
              ₹{totalReceivables.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <div className="p-4 bg-white border border-navy-100 rounded-xl shadow-card flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-brass-50 text-brass-700 flex items-center justify-center flex-shrink-0">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-navy-500">Total Credit Extended</p>
            <p className="text-xl font-bold text-navy-900 font-mono tabular-nums">
              ₹{customers.reduce((acc: number, c: Customer) => acc + Number(c.creditLimit || 0), 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
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
                placeholder="Search customers..."
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
                className="w-full sm:w-36"
              />
              <Select
                value={typeFilter}
                onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
                options={[{ value: '', label: 'All Types' }, ...typeOptions]}
                placeholder="Filter by type"
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
            <div className="p-8 text-center text-danger-600 font-medium text-sm">Failed to load customer directory</div>
          ) : (
            <DataTable
              data={customers}
              columns={[
                { 
                  key: 'name', 
                  header: 'Client / Business',
                  render: (row) => (
                    <div>
                      <div className="font-semibold text-xs text-navy-900">{row.name}</div>
                      {row.businessName && (
                        <div className="text-[11px] text-navy-500 flex items-center gap-1 mt-0.5">
                          <Building2 className="w-3 h-3 text-navy-400" />
                          {row.businessName}
                        </div>
                      )}
                    </div>
                  )
                },
                { 
                  key: 'customerType', 
                  header: 'Type', 
                  width: '120px', 
                  render: (row) => (
                    <Badge variant="secondary" size="sm" className="font-mono text-[10px]">
                      {row.customerType}
                    </Badge>
                  ) 
                },
                { 
                  key: 'phone', 
                  header: 'Contact Info', 
                  width: '160px',
                  render: (row) => (
                    <div className="text-xs space-y-0.5">
                      {row.phone && (
                        <div className="text-navy-700 flex items-center gap-1 font-mono text-[11px]">
                          <Phone className="w-3 h-3 text-navy-400" /> {row.phone}
                        </div>
                      )}
                      {row.email && (
                        <div className="text-navy-400 truncate max-w-[150px] text-[11px]">
                          {row.email}
                        </div>
                      )}
                    </div>
                  )
                },
                { 
                  key: 'creditLimit', 
                  header: 'Credit Terms & Limit', 
                  align: 'right', 
                  width: '140px', 
                  render: (row) => (
                    <div className="text-right">
                      <span className="font-mono text-xs text-navy-800 tabular-nums font-semibold block">
                        ₹{Number(row.creditLimit).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                      {row.paymentTerms && (
                        <span className="text-[10px] text-navy-500 font-mono">
                          {row.paymentTerms}
                        </span>
                      )}
                    </div>
                  ) 
                },
                { 
                  key: 'outstandingAmount', 
                  header: 'Outstanding', 
                  align: 'right', 
                  width: '140px', 
                  render: (row) => {
                    const outstanding = Number(row.outstandingAmount || 0);
                    const creditLimit = Number(row.creditLimit || 0);
                    const isBreach = creditLimit > 0 && outstanding > creditLimit;
                    return (
                      <div className="text-right">
                        <span className={`font-mono text-xs font-bold tabular-nums block ${
                          outstanding > 0 ? 'text-danger-700' : 'text-success-700'
                        }`}>
                          ₹{outstanding.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                        {isBreach && (
                          <Badge variant="danger" size="sm" className="text-[9px] mt-0.5">
                            Exceeded
                          </Badge>
                        )}
                      </div>
                    );
                  }
                },
                { 
                  key: 'status', 
                  header: 'Status', 
                  width: '110px', 
                  render: (row) => (
                    <Badge 
                      variant={row.status === 'ACTIVE' ? 'success' : row.status === 'INACTIVE' ? 'secondary' : 'warning'}
                      dot
                      size="sm"
                    >
                      {row.status}
                    </Badge>
                  )
                },
                { 
                  key: 'actions', 
                  header: '', 
                  width: '90px', 
                  align: 'center',
                  render: (row) => (
                    <div className="flex items-center justify-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => openEditModal(row)} 
                        aria-label="Edit customer"
                        className="text-navy-600 hover:text-navy-900 p-1.5 h-7 w-7"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDelete(row.id)} 
                        aria-label="Delete customer" 
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
              emptyMessage="No customer records found"
            />
          )}
        </CardBody>
      </Card>

      {/* Add / Edit Customer Modal */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editingCustomer ? 'Edit Customer' : 'Add Customer'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[72vh] overflow-y-auto px-1 py-1">
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-navy-500 mb-2">
              Primary Identity & Company
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <Input 
                label="Customer Contact Name *" 
                name="name" 
                value={formData.name} 
                onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })} 
                error={formErrors.name} 
                placeholder="Ramesh Kumar" 
              />
              <Input 
                label="Business / Firm Name" 
                name="businessName" 
                value={formData.businessName} 
                onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })} 
                placeholder="Kumar Textiles Ltd." 
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-3.5">
              <Input 
                label="Phone Number" 
                name="phone" 
                value={formData.phone} 
                onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })} 
                placeholder="+91 98765 43210" 
                type="tel" 
              />
              <Input 
                label="Email Address" 
                name="email" 
                type="email" 
                value={formData.email} 
                onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })} 
                error={formErrors.email} 
                placeholder="billing@kumartextiles.com" 
              />
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-navy-500 mb-2">
              Billing Address & Jurisdiction
            </h4>
            <Input 
              label="Street Address" 
              name="address" 
              value={formData.address} 
              onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })} 
              placeholder="Shop 14, Textile Market, Ring Road" 
            />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-3.5">
              <Input 
                label="City" 
                name="city" 
                value={formData.city} 
                onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })} 
                placeholder="Surat" 
              />
              <Input 
                label="State" 
                name="state" 
                value={formData.state} 
                onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })} 
                placeholder="Gujarat" 
              />
              <Input 
                label="Postal Code" 
                name="postalCode" 
                value={formData.postalCode} 
                onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })} 
                placeholder="395002" 
              />
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-navy-500 mb-2">
              Tax ID & Commercial Terms
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <Input 
                label="GSTIN" 
                name="gstNumber" 
                value={formData.gstNumber} 
                onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })} 
                placeholder="24AAAAA0000A1Z5" 
              />
              <Input 
                label="PAN Number" 
                name="panNumber" 
                value={formData.panNumber} 
                onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })} 
                placeholder="AAAAA0000A" 
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-3.5">
              <Select 
                label="Customer Type" 
                name="customerType" 
                value={formData.customerType} 
                onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })} 
                options={typeOptions} 
                placeholder="Select type" 
              />
              <Select 
                label="Account Status" 
                name="status" 
                value={formData.status} 
                onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })} 
                options={statusOptions} 
                placeholder="Select status" 
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-3.5">
              <Input 
                label="Credit Limit (₹)" 
                name="creditLimit" 
                type="number" 
                step="0.01" 
                min="0" 
                value={formData.creditLimit} 
                onChange={(e) => setFormData({ ...formData, [e.target.name]: Number(e.target.value) })} 
                error={formErrors.creditLimit} 
                placeholder="0.00" 
              />
              <Input 
                label="Payment Terms" 
                name="paymentTerms" 
                value={formData.paymentTerms} 
                onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })} 
                placeholder="Net 30 / Advance 50%" 
              />
            </div>
          </div>

          <Input 
            label="Internal Notes" 
            name="notes" 
            value={formData.notes} 
            onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })} 
            placeholder="Special delivery instructions, credit history..." 
          />

          <div className="flex justify-end gap-2.5 pt-4 border-t border-navy-100">
            <Button type="button" variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="primary"
              loading={submitting || createMutation.isPending || updateMutation.isPending}
            >
              {editingCustomer ? 'Update Customer' : 'Create Customer'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Customers;
