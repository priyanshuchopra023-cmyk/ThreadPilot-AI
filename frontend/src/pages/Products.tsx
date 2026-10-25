import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Package, 
  Tag, 
  Layers, 
  DollarSign, 
  Boxes 
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

  const { data, isLoading, error } = useQuery<Product[]>({
    queryKey: ['products', page, pageSize, search, statusFilter],
    queryFn: async () => {
      const res = await productApi.list({ page, size: pageSize, status: statusFilter });
      const pageData = res.data as PaginatedResponse<Product> | undefined;
      return pageData?.content || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: (productData: Partial<Product>) => productApi.create(productData),
    onSuccess: () => {
      toast.success('Product created successfully');
      closeModal();
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : 'Failed to create product');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data: updateData }: { id: string; data: Partial<Product> }) => productApi.update(id, updateData),
    onSuccess: () => {
      toast.success('Product updated successfully');
      closeModal();
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : 'Failed to update product');
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
    const payload = { 
      ...formData, 
      purchasePrice: Number(formData.purchasePrice), 
      sellingPrice: Number(formData.sellingPrice) 
    } as Partial<Product>;

    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data: payload }, {
        onSettled: () => setSubmitting(false)
      });
    } else {
      createMutation.mutate(payload, {
        onSettled: () => setSubmitting(false)
      });
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
        <div className="h-10 bg-navy-100 rounded w-48" />
        <Card><CardBody className="p-6 h-64"><div className="h-4 bg-navy-100 rounded w-1/4 mb-4"/><div className="space-y-3"><div className="h-10 bg-navy-100 rounded"/><div className="h-10 bg-navy-100 rounded"/></div></CardBody></Card>
      </div>
    );
  }

  const products = data || [];
  const totalItems = data?.length || 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Products"
        subtitle="Manage master catalogue, hosiery specifications, variants, and pricing structures"
        breadcrumbs={[
          { label: 'Catalog' },
          { label: 'Products' },
        ]}
        actions={
          <Button 
            onClick={openCreateModal} 
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            className="shadow-sm"
          >
            Add Product
          </Button>
        }
      />

      {/* Metrics Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white border border-navy-100 rounded-xl shadow-card flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-navy-50 text-navy-700 flex items-center justify-center flex-shrink-0">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-navy-500">Active SKUs</p>
            <p className="text-xl font-bold text-navy-900 font-mono tabular-nums">{products.length}</p>
          </div>
        </div>

        <div className="p-4 bg-white border border-navy-100 rounded-xl shadow-card flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-brass-50 text-brass-700 flex items-center justify-center flex-shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-navy-500">Avg Selling Price</p>
            <p className="text-xl font-bold text-navy-900 font-mono tabular-nums">
              ₹{products.length > 0 ? (products.reduce((acc, p) => acc + Number(p.sellingPrice || 0), 0) / products.length).toLocaleString('en-IN', { maximumFractionDigits: 0 }) : '0'}
            </p>
          </div>
        </div>

        <div className="p-4 bg-white border border-navy-100 rounded-xl shadow-card flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center flex-shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-navy-500">Categories</p>
            <p className="text-xl font-bold text-navy-900 font-mono tabular-nums">
              {new Set(products.map(p => p.category).filter(Boolean)).size}
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
                placeholder="Search products..."
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
                className="w-full sm:w-44"
              />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Products Table Card */}
      <Card className="overflow-hidden">
        <CardBody className="p-0">
          {error ? (
            <div className="p-8 text-center text-danger-600 font-medium text-sm">Failed to load product catalog</div>
          ) : (
            <DataTable<Product>
              data={products}
              columns={[
                { 
                  key: 'sku', 
                  header: 'SKU', 
                  width: '130px',
                  render: (row: Product) => (
                    <span className="font-mono text-xs font-semibold text-navy-900">
                      {row.sku}
                    </span>
                  )
                },
                { 
                  key: 'name', 
                  header: 'Product Details',
                  render: (row: Product) => {
                    const hasValidImage = Boolean(
                      row.imageUrl &&
                      (row.imageUrl.startsWith('http://') ||
                       row.imageUrl.startsWith('https://') ||
                       row.imageUrl.startsWith('data:image/'))
                    );

                    return (
                      <div className="flex items-center gap-3">
                        {hasValidImage ? (
                          <img 
                            src={row.imageUrl} 
                            alt={row.name} 
                            className="w-9 h-9 rounded-lg object-cover border border-secondary-200 flex-shrink-0" 
                            onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-navy-50 text-navy-700 flex items-center justify-center flex-shrink-0 border border-navy-100/60">
                            <Package className="w-4 h-4 text-navy-500" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="font-medium text-xs text-navy-900 truncate">{row.name}</div>
                          {(row.material || row.size || row.color) && (
                            <div className="text-[11px] text-navy-400 mt-0.5 flex items-center gap-1.5 font-mono truncate">
                              {row.material && <span>{row.material}</span>}
                              {row.size && <span>• Sz: {row.size}</span>}
                              {row.color && <span>• {row.color}</span>}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }
                },
                { 
                  key: 'category', 
                  header: 'Category', 
                  width: '140px',
                  render: (row: Product) => (
                    <span className="text-xs text-navy-600">
                      {row.category || '—'}
                    </span>
                  )
                },
                { 
                  key: 'brand', 
                  header: 'Brand', 
                  width: '120px',
                  render: (row: Product) => (
                    <span className="text-xs text-navy-600 font-medium">
                      {row.brand || '—'}
                    </span>
                  )
                },
                { 
                  key: 'sellingPrice', 
                  header: 'Selling Price', 
                  align: 'right', 
                  width: '130px',
                  render: (row: Product) => (
                    <span className="font-mono text-xs font-bold text-navy-900 tabular-nums">
                      ₹{Number(row.sellingPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  ) 
                },
                { 
                  key: 'status', 
                  header: 'Status', 
                  width: '120px', 
                  render: (row: Product) => (
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
                  render: (row: Product) => (
                    <div className="flex items-center justify-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => openEditModal(row)} 
                        aria-label="Edit product"
                        className="text-navy-600 hover:text-navy-900 p-1.5 h-7 w-7"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDelete(row.id)} 
                        aria-label="Delete product" 
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
              emptyMessage="No products found in catalogue"
              emptyAction={{
                label: '+ Add First Product',
                onClick: openCreateModal,
              }}
            />
          )}
        </CardBody>
      </Card>

      {/* Add / Edit Product Modal */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editingProduct ? 'Edit Product' : 'Add Product'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-5 max-h-[72vh] overflow-y-auto px-1 py-1">
          {/* General Identification */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-navy-500 mb-2.5">
              General Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <Input 
                label="SKU *" 
                name="sku" 
                value={formData.sku} 
                onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })} 
                error={formErrors.sku} 
                placeholder="PROD-001" 
                disabled={!!editingProduct} 
              />
              <Input 
                label="Name *" 
                name="name" 
                value={formData.name} 
                onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })} 
                error={formErrors.name} 
                placeholder="Cotton Crew Socks" 
              />
            </div>
          </div>

          {/* Classification & Attributes */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-navy-500 mb-2.5">
              Hosiery Attributes & Brand
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <Input 
                label="Brand" 
                name="brand" 
                value={formData.brand} 
                onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })} 
                placeholder="Brand name" 
              />
              <Input 
                label="Category" 
                name="category" 
                value={formData.category} 
                onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })} 
                placeholder="Hosiery, Undergarments, etc." 
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-3.5">
              <Input 
                label="Subcategory" 
                name="subcategory" 
                value={formData.subcategory} 
                onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })} 
                placeholder="Ankle Socks, Sports, etc." 
              />
              <Input 
                label="Size" 
                name="size" 
                value={formData.size} 
                onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })} 
                placeholder="Free Size, M, L, XL" 
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-3.5">
              <Input 
                label="Color" 
                name="color" 
                value={formData.color} 
                onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })} 
                placeholder="Black / Navy / Melange" 
              />
              <Input 
                label="Material" 
                name="material" 
                value={formData.material} 
                onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })} 
                placeholder="Combed Cotton 80%" 
              />
              <Input 
                label="Gender" 
                name="gender" 
                value={formData.gender} 
                onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })} 
                placeholder="Unisex / Men / Women" 
              />
            </div>
          </div>

          {/* Pricing & Inventory Thresholds */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-navy-500 mb-2.5">
              Commercial Terms & Stock Limits
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <Input 
                label="Purchase Price (₹) *" 
                name="purchasePrice" 
                type="number" 
                step="0.01" 
                min="0" 
                value={formData.purchasePrice} 
                onChange={(e) => setFormData({ ...formData, [e.target.name]: Number(e.target.value) })} 
                error={formErrors.purchasePrice} 
                placeholder="0.00" 
              />
              <Input 
                label="Selling Price (₹) *" 
                name="sellingPrice" 
                type="number" 
                step="0.01" 
                min="0" 
                value={formData.sellingPrice} 
                onChange={(e) => setFormData({ ...formData, [e.target.name]: Number(e.target.value) })} 
                error={formErrors.sellingPrice} 
                placeholder="0.00" 
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-3.5">
              <Input 
                label="Min Stock Level" 
                name="minStockLevel" 
                type="number" 
                min="0" 
                value={formData.minStockLevel} 
                onChange={(e) => setFormData({ ...formData, [e.target.name]: Number(e.target.value) })} 
                placeholder="0" 
              />
              <Input 
                label="Reorder Qty" 
                name="reorderQuantity" 
                type="number" 
                min="0" 
                value={formData.reorderQuantity} 
                onChange={(e) => setFormData({ ...formData, [e.target.name]: Number(e.target.value) })} 
                placeholder="0" 
              />
              <Input 
                label="Packaging Unit" 
                name="unit" 
                value={formData.unit} 
                onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })} 
                placeholder="pairs / dozens / box" 
              />
            </div>
          </div>

          {/* Lifecycle & Identifiers */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-navy-500 mb-2.5">
              Metadata & Barcoding
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <Input 
                label="Barcode / EAN" 
                name="barcode" 
                value={formData.barcode} 
                onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })} 
                placeholder="8901234567890" 
              />
              <Select 
                label="Product Status" 
                name="status" 
                value={formData.status} 
                onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })} 
                options={statusOptions} 
                placeholder="Select status" 
              />
            </div>
            <div className="mt-3.5">
              <Input 
                label="Description" 
                name="description" 
                value={formData.description} 
                onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })} 
                placeholder="Product description and yarn blend notes" 
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
              {editingProduct ? 'Update Product' : 'Create Product'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Products;
