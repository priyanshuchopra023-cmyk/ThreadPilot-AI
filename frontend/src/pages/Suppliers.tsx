import React, { useState } from 'react';
import { 
  Search, 
  Truck, 
  Plus, 
  Edit, 
  Trash2, 
  Building2, 
  Phone, 
  DollarSign, 
  ShieldCheck 
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
      const pageData = res.data as PaginatedResponse<Supplier> | undefined;
      return pageData?.content || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: (supplierData: Partial<Supplier>) => supplierApi.create(supplierData),
    onSuccess: () => {
      toast.success('Supplier created successfully');
      closeModal();
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : 'Failed to create supplier');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data: updateData }: { id: string; data: Partial<Supplier> }) => 
      supplierApi.update(id, updateData),
    onSuccess: () => {
      toast.success('Supplier updated successfully');
      closeModal();
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : 'Failed to update supplier');
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
    const payload = formData as Partial<Supplier>;
    if (editingSupplier) {
      updateMutation.mutate({ id: editingSupplier.id, data: payload }, {
        onSettled: () => setSubmitting(false)
      });
    } else {
      createMutation.mutate(payload, {
        onSettled: () => setSubmitting(false)
      });
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
        <div className="h-10 bg-navy-100 rounded w-48" />
        <Card><CardBody className="p-6 h-64"><div className="h-4 bg-navy-100 rounded w-1/4 mb-4"/><div className="space-y-3"><div className="h-10 bg-navy-100 rounded"/><div className="h-10 bg-navy-100 rounded"/></div></CardBody></Card>
      </div>
    );
  }

  const suppliers = data || [];
  const totalItems = data?.length || 0;
  const totalPayables = suppliers.reduce((acc, s) => acc + Number(s.outstandingAmount || 0), 0);
  const activeCount = suppliers.filter(s => s.status === 'ACTIVE').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Suppliers"
        subtitle="Yarn spinning mills, packaging vendors, accessories suppliers, and liability ledgers"
        breadcrumbs={[
          { label: 'Commerce' },
          { label: 'Suppliers' },
        ]}
        actions={
          <Button 
            onClick={openCreateModal} 
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            className="shadow-sm"
          >
            Add Supplier
          </Button>
        }
      />

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white border border-navy-100 rounded-xl shadow-card flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-navy-50 text-navy-700 flex items-center justify-center flex-shrink-0">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-navy-500">Active Vendors</p>
            <p className="text-xl font-bold text-navy-900 font-mono tabular-nums">{activeCount} / {suppliers.length}</p>
          </div>
        </div>

        <div className="p-4 bg-white border border-navy-100 rounded-xl shadow-card flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-danger-50 text-danger-700 flex items-center justify-center flex-shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-navy-500">Total Outstanding Payables</p>
            <p className="text-xl font-bold text-danger-800 font-mono tabular-nums">
              ₹{totalPayables.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <div className="p-4 bg-white border border-navy-100 rounded-xl shadow-card flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-brass-50 text-brass-700 flex items-center justify-center flex-shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-navy-500">Registered Entities</p>
            <p className="text-xl font-bold text-navy-900 font-mono tabular-nums">
              {suppliers.filter(s => s.gstNumber).length} Verified GST
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
                placeholder="Search suppliers..."
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
                className="w-full sm:w-40"
              />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Table Card */}
      <Card className="overflow-hidden">
        <CardBody className="p-0">
          {error ? (
            <div className="p-8 text-center text-danger-600 font-medium text-sm">Failed to load supplier directory</div>
          ) : (
            <DataTable<Supplier>
              data={suppliers}
              columns={[
                { 
                  key: 'name', 
                  header: 'Supplier / Mill',
                  render: (row: Supplier) => (
                    <div>
                      <div className="font-semibold text-xs text-navy-900">{row.name}</div>
                      {row.companyName && (
                        <div className="text-[11px] text-navy-500 flex items-center gap-1 mt-0.5">
                          <Building2 className="w-3 h-3 text-navy-400" />
                          {row.companyName}
                        </div>
                      )}
                    </div>
                  )
                },
                { 
                  key: 'phone', 
                  header: 'Contact Info', 
                  width: '160px',
                  render: (row: Supplier) => (
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
                  key: 'gstNumber', 
                  header: 'GSTIN / PAN', 
                  width: '150px',
                  render: (row: Supplier) => (
                    <div className="font-mono text-xs">
                      {row.gstNumber ? (
                        <span className="text-navy-800 font-semibold">{row.gstNumber}</span>
                      ) : (
                        <span className="text-navy-400">Not recorded</span>
                      )}
                    </div>
                  )
                },
                { 
                  key: 'outstandingAmount', 
                  header: 'Payable Balance', 
                  align: 'right', 
                  width: '140px', 
                  render: (row: Supplier) => {
                    const payables = Number(row.outstandingAmount || 0);
                    return (
                      <span className={`font-mono text-xs font-bold tabular-nums ${
                        payables > 0 ? 'text-danger-700' : 'text-success-700'
                      }`}>
                        ₹{payables.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    );
                  }
                },
                { 
                  key: 'paymentTerms', 
                  header: 'Terms', 
                  width: '110px',
                  render: (row: Supplier) => (
                    <span className="text-xs text-navy-600 font-medium">
                      {row.paymentTerms || 'Standard'}
                    </span>
                  )
                },
                { 
                  key: 'status', 
                  header: 'Status', 
                  width: '110px', 
                  render: (row: Supplier) => (
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
                  render: (row: Supplier) => (
                    <div className="flex items-center justify-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => openEditModal(row)} 
                        aria-label="Edit supplier"
                        className="text-navy-600 hover:text-navy-900 p-1.5 h-7 w-7"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDelete(row.id)} 
                        aria-label="Delete supplier" 
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
              emptyMessage="No supplier records found"
            />
          )}
        </CardBody>
      </Card>

      {/* Add / Edit Supplier Modal */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editingSupplier ? 'Edit Supplier' : 'Add Supplier'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[72vh] overflow-y-auto px-1 py-1">
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-navy-500 mb-2">
              Vendor Identity & Representative
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <Input 
                label="Primary Contact Person *" 
                name="name" 
                value={formData.name} 
                onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })} 
                error={formErrors.name} 
                placeholder="Anil Gupta" 
              />
              <Input 
                label="Company / Mill Legal Name" 
                name="companyName" 
                value={formData.companyName} 
                onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })} 
                placeholder="Vardhman Spinning & Weaving Mills" 
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-3.5">
              <Input 
                label="Phone Number" 
                name="phone" 
                value={formData.phone} 
                onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })} 
                placeholder="+91 98765 12345" 
                type="tel" 
              />
              <Input 
                label="Email Address" 
                name="email" 
                type="email" 
                value={formData.email} 
                onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })} 
                error={formErrors.email} 
                placeholder="accounts@vardhman.com" 
              />
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-navy-500 mb-2">
              Factory Address & Jurisdiction
            </h4>
            <Input 
              label="Street / Mill Address" 
              name="address" 
              value={formData.address} 
              onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })} 
              placeholder="Plot 45, Focal Point Phase IV" 
            />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-3.5">
              <Input 
                label="City" 
                name="city" 
                value={formData.city} 
                onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })} 
                placeholder="Ludhiana" 
              />
              <Input 
                label="State" 
                name="state" 
                value={formData.state} 
                onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })} 
                placeholder="Punjab" 
              />
              <Input 
                label="Postal Code" 
                name="postalCode" 
                value={formData.postalCode} 
                onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })} 
                placeholder="141010" 
              />
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-navy-500 mb-2">
              Tax Registration & Terms
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <Input 
                label="GSTIN" 
                name="gstNumber" 
                value={formData.gstNumber} 
                onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })} 
                placeholder="03AAAAA0000A1Z5" 
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
              <Input 
                label="Credit Payment Terms" 
                name="paymentTerms" 
                value={formData.paymentTerms} 
                onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })} 
                placeholder="Net 45 / 15 Days LC" 
              />
              <Select 
                label="Vendor Status" 
                name="status" 
                value={formData.status} 
                onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })} 
                options={statusOptions} 
                placeholder="Select status" 
              />
            </div>
          </div>

          <Input 
            label="Internal Notes" 
            name="notes" 
            value={formData.notes} 
            onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })} 
            placeholder="Yarn count specialties, bank details, delivery lead times..." 
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
              {editingSupplier ? 'Update Supplier' : 'Create Supplier'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Suppliers;
