import React, { useState, FormEvent } from 'react';
import { Search, Filter, Truck, Plus, Edit, Trash2, Eye, ChevronDown } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { DataTable } from '../components/tables/DataTable';
import { Badge } from '../components/ui/Badge';
import { supplierApi } from '../api/endpoints';
import type { Supplier, PaginatedResponse } from '../types';
import toast from 'react-hot-toast';

const statusOptions = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'BLACKLISTED', label: 'Blacklisted' },
  { value: 'ON_HOLD', label: 'On Hold' },
];

const initialFormData = {
  name: '',
  companyName: '',
  phone: '',
  email: '',
  address: '',
  city: '',
  state: '',
  postalCode: '',
  gstNumber: '',
  panNumber: '',
  paymentTerms: '',
  status: 'ACTIVE',
  notes: '',
};

type SupplierFormData = typeof initialFormData;

export const Suppliers: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState<SupplierFormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const { data, isLoading, error } = useQuery<Supplier[]>({
    queryKey: ['suppliers', page, pageSize, search, statusFilter],
    queryFn: async () => {
      const res = await supplierApi.list({ page, size: pageSize, status: statusFilter });
      return (res.data as unknown) as Supplier[];
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<Supplier>) => supplierApi.create(data),
    onSuccess: () => {
      toast.success('Supplier created successfully');
      closeModal();
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Failed to create supplier');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Supplier> }) => supplierApi.update(id, data),
    onSuccess: () => {
      toast.success('Supplier updated successfully');
      closeModal();
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Failed to update supplier');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => supplierApi.delete(id),
    onSuccess: () => {
      toast.success('Supplier deleted');
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
    onError: () => toast.error('Failed to delete supplier'),
  });

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = 'Invalid email format';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    const data = formData as Partial<Supplier>;
    if (editingSupplier) {
      updateMutation.mutate({ id: editingSupplier.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const openCreateModal = () => {
    setEditingSupplier(null);
    setFormData(initialFormData);
    setFormErrors({});
    setShowModal(true);
  };

  const openEditModal = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      companyName: supplier.companyName || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
      city: supplier.city || '',
      state: supplier.state || '',
      postalCode: supplier.postalCode || '',
      gstNumber: supplier.gstNumber || '',
      panNumber: supplier.panNumber || '',
      paymentTerms: supplier.paymentTerms || '',
      status: supplier.status,
      notes: supplier.notes || '',
    });
    setFormErrors({});
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingSupplier(null);
    setFormData(initialFormData);
    setFormErrors({});
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this supplier?')) {
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

  const suppliers = data || [];
  const totalItems = data?.length || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 flex items-center gap-2">
            <Truck className="w-6 h-6 text-primary-600" />
            Suppliers
          </h1>
          <p className="text-secondary-600 mt-1">Manage your supplier relationships</p>
        </div>
        <Button onClick={openCreateModal} leftIcon={<Plus className="w-4 h-4" />}>
          Add Supplier
        </Button>
      </div>

      <Card>
        <CardBody className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400 w-5 h-5" />
              <Input
                placeholder="Search suppliers..."
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
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="p-0">
          {error ? (
            <div className="p-6 text-center text-red-600">Failed to load suppliers</div>
          ) : (
            <DataTable<Supplier>
              data={suppliers}
              columns={[
                { key: 'name', header: 'Name' },
                { key: 'companyName', header: 'Company', width: '150px' },
                { key: 'phone', header: 'Phone', width: '130px' },
                { key: 'email', header: 'Email', width: '180px' },
                { key: 'gstNumber', header: 'GST', width: '150px' },
                { key: 'outstandingAmount', header: 'Outstanding', align: 'right', width: '130px', render: (row: Supplier) => (
                  <span className={Number(row.outstandingAmount) > 0 ? 'font-medium text-red-600' : 'font-medium text-green-600'}>
                    ₹{Number(row.outstandingAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                )},
                { key: 'paymentTerms', header: 'Terms', width: '100px' },
                { key: 'status', header: 'Status', width: '120px', render: (row) => (
                  <Badge variant={row.status === 'ACTIVE' ? 'success' : row.status === 'INACTIVE' ? 'secondary' : 'warning'}>
                    {row.status}
                  </Badge>
                )},
                { key: 'actions', header: '', width: '120px', render: (row) => (
                  <div className="flex items-center justify-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => openEditModal(row)} aria-label="Edit supplier">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(row.id)} aria-label="Delete supplier" className="text-red-600 hover:bg-red-50">
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
              emptyMessage="No suppliers found"
            />
          )}
        </CardBody>
      </Card>

      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editingSupplier ? 'Edit Supplier' : 'Add Supplier'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto">
          <Input label="Name *" name="name" value={formData.name} onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })} error={formErrors.name} placeholder="Supplier Name" />
          <Input label="Company Name" name="companyName" value={formData.companyName} onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })} placeholder="Company Name" />
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
            <Input label="Payment Terms" name="paymentTerms" value={formData.paymentTerms} onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })} placeholder="Net 30" />
            <Select label="Status" name="status" value={formData.status} onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })} options={statusOptions} placeholder="Select status" />
          </div>
          <Input label="Notes" name="notes" value={formData.notes} onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })} placeholder="Additional notes" className="md:col-span-2" />

          <div className="flex justify-end gap-3 pt-4 border-t border-secondary-200">
            <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button type="submit" loading={submitting || createMutation.isPending || updateMutation.isPending}>
              {editingSupplier ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};