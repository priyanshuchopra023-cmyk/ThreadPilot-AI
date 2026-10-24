import React, { useState, FormEvent } from 'react';
import { Plus, Search, Filter, Edit, Trash2, Package, ChevronDown } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { DataTable } from '../components/tables/DataTable';
import { Badge } from '../components/ui/Badge';
import { productApi } from '../api/endpoints';
import type { Product, PaginatedResponse } from '../types';
import toast from 'react-hot-toast';

const statusOptions = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'DISCONTINUED', label: 'Discontinued' },
  { value: 'ARCHIVED', label: 'Archived' },
];

const initialFormData = {
  sku: '',
  name: '',
  brand: '',
  category: '',
  subcategory: '',
  size: '',
  color: '',
  material: '',
  gender: '',
  unit: '',
  purchasePrice: 0,
  sellingPrice: 0,
  minStockLevel: 0,
  reorderQuantity: 0,
  barcode: '',
  status: 'ACTIVE',
  description: '',
  imageUrl: '',
  supplierId: '',
};

type ProductFormData = typeof initialFormData;

export const Products: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const { data, isLoading, error, refetch } = useQuery<Product[]>({
    queryKey: ['products', page, pageSize, search, statusFilter],
    queryFn: async () => {
      const res = await productApi.list({ page, size: pageSize, status: statusFilter });
      const pageData = res.data as PaginatedResponse<Product> | undefined;
      return pageData?.content || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<Product>) => productApi.create(data),
    onSuccess: () => {
      toast.success('Product created successfully');
      closeModal();
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Failed to create product');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Product> }) => productApi.update(id, data),
    onSuccess: () => {
      toast.success('Product updated successfully');
      closeModal();
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Failed to update product');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productApi.delete(id),
    onSuccess: () => {
      toast.success('Product deleted');
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: () => toast.error('Failed to delete product'),
  });

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.sku.trim()) errors.sku = 'SKU is required';
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (formData.purchasePrice <= 0) errors.purchasePrice = 'Purchase price must be greater than 0';
    if (formData.sellingPrice <= 0) errors.sellingPrice = 'Selling price must be greater than 0';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    const data = { ...formData, purchasePrice: Number(formData.purchasePrice), sellingPrice: Number(formData.sellingPrice) } as Partial<Product>;

    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormData(initialFormData);
    setFormErrors({});
    setShowModal(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      sku: product.sku,
      name: product.name,
      brand: product.brand || '',
      category: product.category || '',
      subcategory: product.subcategory || '',
      size: product.size || '',
      color: product.color || '',
      material: product.material || '',
      gender: product.gender || '',
      unit: product.unit || '',
      purchasePrice: product.purchasePrice,
      sellingPrice: product.sellingPrice,
      minStockLevel: product.minStockLevel,
      reorderQuantity: product.reorderQuantity,
      barcode: product.barcode || '',
      status: product.status,
      description: product.description || '',
      imageUrl: product.imageUrl || '',
      supplierId: product.supplierId || '',
    });
    setFormErrors({});
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setFormData(initialFormData);
    setFormErrors({});
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
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

  const products = data || [];
  const totalItems = data?.length || 0;
  const totalPages = 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 flex items-center gap-2">
            <Package className="w-6 h-6 text-primary-600" />
            Products
          </h1>
          <p className="text-secondary-600 mt-1">Manage your product catalog</p>
        </div>
        <Button onClick={openCreateModal} leftIcon={<Plus className="w-4 h-4" />}>
          Add Product
        </Button>
      </div>

      <Card>
        <CardBody className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400 w-5 h-5" />
              <Input
                placeholder="Search products..."
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
              className="w-full sm:w-48"
            />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="p-0">
          {error ? (
            <div className="p-6 text-center text-red-600">Failed to load products</div>
          ) : (
            <DataTable<Product>
              data={products}
              columns={[
                { key: 'sku', header: 'SKU', width: '120px' },
                { key: 'name', header: 'Name' },
                { key: 'category', header: 'Category', width: '140px' },
                { key: 'brand', header: 'Brand', width: '120px' },
                { key: 'sellingPrice', header: 'Selling Price', align: 'right', render: (row: Product) => `₹${Number(row.sellingPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` },
                { key: 'status', header: 'Status', width: '120px', render: (row: Product) => (
                  <Badge variant={row.status === 'ACTIVE' ? 'success' : row.status === 'INACTIVE' ? 'secondary' : 'warning'}>
                    {row.status}
                  </Badge>
                )},
                { key: 'actions', header: '', width: '100px', render: (row) => (
                  <div className="flex items-center justify-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => openEditModal(row)} aria-label="Edit product">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(row.id)} aria-label="Delete product" className="text-red-600 hover:bg-red-50">
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
              emptyMessage="No products found"
            />
          )}
        </CardBody>
      </Card>

      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editingProduct ? 'Edit Product' : 'Add Product'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <Input label="SKU *" name="sku" value={formData.sku} onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })} error={formErrors.sku} placeholder="PROD-001" disabled={!!editingProduct} />
            <Input label="Name *" name="name" value={formData.name} onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })} error={formErrors.name} placeholder="Product Name" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Brand" name="brand" value={formData.brand} onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })} placeholder="Brand" />
            <Input label="Category" name="category" value={formData.category} onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })} placeholder="Category" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Subcategory" name="subcategory" value={formData.subcategory} onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })} placeholder="Subcategory" />
            <Input label="Size" name="size" value={formData.size} onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })} placeholder="Size" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Color" name="color" value={formData.color} onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })} placeholder="Color" />
            <Input label="Material" name="material" value={formData.material} onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })} placeholder="Material" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Gender" name="gender" value={formData.gender} onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })} placeholder="Men/Women/Unisex" />
            <Input label="Unit" name="unit" value={formData.unit} onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })} placeholder="pcs/box/pack" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Purchase Price *" name="purchasePrice" type="number" step="0.01" min="0" value={formData.purchasePrice} onChange={(e) => setFormData({ ...formData, [e.target.name]: Number(e.target.value) })} error={formErrors.purchasePrice} placeholder="0.00" />
            <Input label="Selling Price *" name="sellingPrice" type="number" step="0.01" min="0" value={formData.sellingPrice} onChange={(e) => setFormData({ ...formData, [e.target.name]: Number(e.target.value) })} error={formErrors.sellingPrice} placeholder="0.00" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Min Stock Level" name="minStockLevel" type="number" min="0" value={formData.minStockLevel} onChange={(e) => setFormData({ ...formData, [e.target.name]: Number(e.target.value) })} placeholder="0" />
            <Input label="Reorder Quantity" name="reorderQuantity" type="number" min="0" value={formData.reorderQuantity} onChange={(e) => setFormData({ ...formData, [e.target.name]: Number(e.target.value) })} placeholder="0" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Barcode" name="barcode" value={formData.barcode} onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })} placeholder="Barcode" />
            <Select label="Status" name="status" value={formData.status} onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })} options={statusOptions} placeholder="Select status" />
          </div>
          <Input label="Description" name="description" value={formData.description} onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })} placeholder="Product description" className="md:col-span-2" />
          <Input label="Image URL" name="imageUrl" value={formData.imageUrl} onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })} placeholder="https://example.com/image.jpg" className="md:col-span-2" />
          <Input label="Supplier ID" name="supplierId" value={formData.supplierId} onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })} placeholder="Supplier UUID" className="md:col-span-2" />

          <div className="flex justify-end gap-3 pt-4 border-t border-secondary-200">
            <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button type="submit" loading={submitting || createMutation.isPending || updateMutation.isPending}>
              {editingProduct ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};