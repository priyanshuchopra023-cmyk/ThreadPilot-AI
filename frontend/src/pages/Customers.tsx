import React, { useState, FormEvent } from 'react';
import { Plus, Search, Users, Edit, Trash2, Eye, ChevronDown } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { DataTable } from '../components/tables/DataTable';
import { Badge } from '../components/ui/Badge';
import { customerApi } from '../api/endpoints';
import type { Customer, PaginatedResponse } from '../types';
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
    mutationFn: (data: Partial<Customer>) => customerApi.create(data),
    onSuccess: () => {
      toast.success('Customer created successfully');
      closeModal();
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Failed to create customer');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Customer> }) => customerApi.update(id, data),
    onSuccess: () => {
      toast.success('Customer updated successfully');
      closeModal();
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Failed to update customer');
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
    const data = { ...formData, creditLimit: Number(formData.creditLimit) };

    if (editingCustomer) {
      updateMutation.mutate({ id: editingCustomer.id, data });
    } else {
      createMutation.mutate(data);
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
        <div className="flex items-center justify-between">
          <div className="h-8 bg-secondary-200 rounded w-48" />
          <div className="h-10 bg-secondary-200 rounded w-32" />
        </div>
        <Card><CardBody className="p-6 h-64"><div className="h-4 bg-secondary-200 rounded w-1/4 mb-4"/><div className="space-y-3"><div className="h-10 bg-secondary-200 rounded"/><div className="h-10 bg-secondary-200 rounded"/></div></CardBody></Card>
      </div>
    );
  }

  const customers = data?.data?.content || [];
  const totalItems = data?.data?.totalElements || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-primary-600" />
            Customers
          </h1>
          <p className="text-secondary-600 mt-1">Manage your customer relationships</p>
        </div>
        <Button onClick={openCreateModal} leftIcon={<Plus className="w-4 h-4" />}>
          Add Customer
        </Button>
      </div>

      <Card>
        <CardBody className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400 w-5 h-5" />
              <Input
                placeholder="Search customers..."
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
              className="w-full sm:w-40"
            />
            <Select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
              options={[{ value: '', label: 'All Types' }, ...typeOptions]}
              placeholder="Filter by type"
              className="w-full sm:w-40"
            />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="p-0">
          {error ? (
            <div className="p-6 text-center text-red-600">Failed to load customers</div>
          ) : (
            <DataTable
              data={customers}
              columns={[
                { key: 'name', header: 'Name' },
                { key: 'businessName', header: 'Business', width: '150px' },
                { key: 'customerType', header: 'Type', width: '120px', render: (row) => <Badge variant="info">{row.customerType}</Badge> },
                { key: 'phone', header: 'Phone', width: '130px' },
                { key: 'email', header: 'Email', width: '180px' },
                { key: 'creditLimit', header: 'Credit Limit', align: 'right', width: '120px', render: (row) => `₹${Number(row.creditLimit).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` },
                { key: 'outstandingAmount', header: 'Outstanding', align: 'right', width: '120px', render: (row) => (
                  <span className={Number(row.outstandingAmount) > 0 ? 'font-medium text-red-600' : 'font-medium text-green-600'}>
                    ₹{Number(row.outstandingAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                )},
                { key: 'status', header: 'Status', width: '120px', render: (row) => (
                  <Badge variant={row.status === 'ACTIVE' ? 'success' : row.status === 'INACTIVE' ? 'secondary' : 'warning'}>
                    {row.status}
                  </Badge>
                )},
                { key: 'actions', header: '', width: '120px', render: (row) => (
                  <div className="flex items-center justify-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => openEditModal(row)} aria-label="Edit customer">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(row.id)} aria-label="Delete customer" className="text-red-600 hover:bg-red-50">
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
              emptyMessage="No customers found"
            />
          )}
        </CardBody>
      </Card>

      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editingCustomer ? 'Edit Customer' : 'Add Customer'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto">
          <Input label="Name *" name="name" value={formData.name} onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })} error={formErrors.name} placeholder="Customer Name" />
          <Input label="Business Name" name="businessName" value={formData.businessName} onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })} placeholder="Business Name" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Phone" name="phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })} placeholder="Phone" type="tel" />
            <Input label="Email" name="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })} error={formErrors.email} placeholder="email@example.com" />
          </div>
          <Input label="Address" name="address" value={formData.address} onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })} placeholder="Address" />
          <div className="grid grid-cols-3 gap-4">
            <Input label="City" name="city" value={formData.city} onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })} placeholder="City" />
            <Input label="State" name="state" value={formData.state} onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })} placeholder="State" />
            <Input label="Postal Code" name="postalCode" value={formData.postalCode} onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })} placeholder="Postal Code" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="GST Number" name="gstNumber" value={formData.gstNumber} onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })} placeholder="GST Number" />
            <Input label="PAN Number" name="panNumber" value={formData.panNumber} onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })} placeholder="PAN Number" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select label="Customer Type" name="customerType" value={formData.customerType} onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })} options={typeOptions} placeholder="Select type" />
            <Select label="Status" name="status" value={formData.status} onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })} options={statusOptions} placeholder="Select status" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Credit Limit" name="creditLimit" type="number" step="0.01" min="0" value={formData.creditLimit} onChange={(e) => setFormData({ ...formData, [e.target.name]: Number(e.target.value) })} error={formErrors.creditLimit} placeholder="0.00" />
            <Input label="Payment Terms" name="paymentTerms" value={formData.paymentTerms} onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })} placeholder="Net 30" />
          </div>
          <Input label="Notes" name="notes" value={formData.notes} onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })} placeholder="Additional notes" className="md:col-span-2" />

          <div className="flex justify-end gap-3 pt-4 border-t border-secondary-200">
            <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button type="submit" loading={submitting || createMutation.isPending || updateMutation.isPending}>
              {editingCustomer ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};