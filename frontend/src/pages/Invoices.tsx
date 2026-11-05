import React, { useState, useCallback, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  FileText, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  ChevronDown, 
  Upload, 
  AlertTriangle, 
  Save, 
  X, 
  Loader2, 
  Download, 
  ExternalLink, 
  Clock, 
  CreditCard, 
  AlertCircle, 
  CheckCircle, 
  FileQuestion,
  FileCheck2,
  Calendar,
  Building2,
  Package
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { DataTable } from '../components/tables/DataTable';
import { Badge } from '../components/ui/Badge';
import { PageHeader } from '../components/ui/PageHeader';
import { invoiceApi, supplierApi, productApi } from '../api/endpoints';
import api from '../api/client';
import type { 
  SupplierInvoice, 
  PaginatedResponse, 
  OcrResult, 
  OcrLineItem, 
  SupplierInvoiceItem,
  Supplier,
  Product
} from '../types';
import toast from 'react-hot-toast';

const statusOptions = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'PROCESSING', label: 'Processing' },
  { value: 'VERIFIED', label: 'Verified' },
  { value: 'PAID', label: 'Paid' },
  { value: 'PARTIALLY_PAID', label: 'Partially Paid' },
  { value: 'OVERDUE', label: 'Overdue' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const ocrStatusOptions = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'PROCESSING', label: 'Processing' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'VERIFIED', label: 'Verified' },
];

interface ReviewInvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  discountRate: number;
}

interface ReviewData {
  invoiceNumber?: string;
  invoiceDate?: string;
  dueDate?: string;
  supplierId?: string;
  notes?: string;
  documentUrl?: string;
  items: ReviewInvoiceItem[];
}

interface ManualItemForm {
  productId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  discountRate: number;
}

const formatCurrency = (val?: number | string) => {
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (num === undefined || num === null || isNaN(num)) return '₹0.00';
  return '₹' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
};

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case 'PAID': return 'success';
    case 'VERIFIED': return 'primary';
    case 'PARTIALLY_PAID': return 'warning';
    case 'OVERDUE': return 'danger';
    case 'CANCELLED': return 'secondary';
    case 'PROCESSING': return 'warning';
    default: return 'secondary';
  }
};

const getOcrBadgeVariant = (ocrStatus: string) => {
  switch (ocrStatus) {
    case 'COMPLETED': return 'success';
    case 'VERIFIED': return 'primary';
    case 'PROCESSING': return 'warning';
    case 'FAILED': return 'danger';
    default: return 'secondary';
  }
};

export const Invoices: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [ocrStatusFilter, setOcrStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showModal, setShowModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<SupplierInvoice | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<SupplierInvoice | null>(null);
  const [showOcrReview, setShowOcrReview] = useState(false);
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null);
  const [reviewData, setReviewData] = useState<ReviewData | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [uploadingInvoiceId, setUploadingInvoiceId] = useState<string | null>(null);
  const [ocrProcessingInvoiceId, setOcrProcessingInvoiceId] = useState<string | null>(null);

  // Form states for Add Invoice
  const [modalTab, setModalTab] = useState<'manual' | 'ocr'>('manual');
  const [newInvoiceData, setNewInvoiceData] = useState({
    supplierId: '',
    invoiceNumber: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: '',
  });
  const [newItems, setNewItems] = useState<ManualItemForm[]>([
    { productId: '', description: '', quantity: 1, unitPrice: 0, taxRate: 18, discountRate: 0 },
  ]);
  const [manualAttachmentFile, setManualAttachmentFile] = useState<File | null>(null);
  const [ocrUploadFile, setOcrUploadFile] = useState<File | null>(null);
  const [ocrSupplierId, setOcrSupplierId] = useState<string>('');
  const [submittingInvoice, setSubmittingInvoice] = useState(false);

  // Fetch invoices
  const { data, isLoading, error, refetch } = useQuery<SupplierInvoice[]>({
    queryKey: ['invoices', page, pageSize, search, statusFilter, ocrStatusFilter],
    queryFn: async () => {
      const res = await invoiceApi.list({ page, size: pageSize, status: statusFilter, ocrStatus: ocrStatusFilter });
      const pageData = res.data as PaginatedResponse<SupplierInvoice> | undefined;
      return pageData?.content || [];
    },
  });

  // Fetch active suppliers for dropdowns
  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: ['suppliers-dropdown'],
    queryFn: async () => {
      const res = await supplierApi.list({ size: 100 });
      const pageData = res.data as PaginatedResponse<Supplier> | undefined;
      return pageData?.content || [];
    },
  });

  // Fetch active products for line items
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['products-dropdown'],
    queryFn: async () => {
      const res = await productApi.list({ size: 100 });
      const pageData = res.data as PaginatedResponse<Product> | undefined;
      return pageData?.content || [];
    },
  });

  const supplierOptions = useMemo(() => {
    return suppliers.map(s => ({
      value: s.id,
      label: `${s.name}${s.gstNumber ? ' (' + s.gstNumber + ')' : ''}`,
    }));
  }, [suppliers]);

  const productOptions = useMemo(() => {
    return [
      { value: '', label: 'Custom / Raw Material' },
      ...products.map(p => ({
        value: p.id,
        label: `${p.name} (${p.sku || 'SKU'})`,
      })),
    ];
  }, [products]);

  // Live calculation of manual invoice totals
  const manualTotals = useMemo(() => {
    let subtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;

    for (const item of newItems) {
      const base = (item.quantity || 0) * (item.unitPrice || 0);
      const discount = base * ((item.discountRate || 0) / 100);
      const taxable = base - discount;
      const tax = taxable * ((item.taxRate || 0) / 100);

      subtotal += base;
      totalDiscount += discount;
      totalTax += tax;
    }

    const grandTotal = subtotal - totalDiscount + totalTax;
    return { subtotal, totalDiscount, totalTax, grandTotal };
  }, [newItems]);

  const closeModal = useCallback(() => {
    setShowModal(false);
    setEditingInvoice(null);
    setViewingInvoice(null);
    setManualAttachmentFile(null);
    setOcrUploadFile(null);
  }, []);

  const openOcrReview = useCallback(async (invoiceId: string) => {
    try {
      const res = await invoiceApi.get(invoiceId);
      const invoiceObj = res.data;
      if (invoiceObj) {
        setViewingInvoice(invoiceObj);
      }

      const result = await invoiceApi.getOcrResult(invoiceId);
      const ocrData = result.data;
      setOcrResult(ocrData);
      loadReviewData(ocrData, invoiceObj);
      setShowOcrReview(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load OCR result');
    }
  }, []);

  function loadReviewData(ocrResultData: any, invoiceObj?: SupplierInvoice) {
    const dataObj = (ocrResultData?.structuredData as Record<string, unknown>) || {};
    const lineItems = ((ocrResultData?.lineItems as OcrLineItem[]) || (dataObj?.lineItems as OcrLineItem[]) || []).map((item) => ({
      description: item.description || '',
      quantity: item.quantity ?? 1,
      unitPrice: item.unitPrice ?? 0,
      taxRate: item.taxRate ?? 18,
      discountRate: item.discountRate ?? 0,
    }));

    setReviewData({
      invoiceNumber: invoiceObj?.invoiceNumber?.startsWith('OCR-') ? ((dataObj.invoiceNumber as string) || invoiceObj.invoiceNumber) : (invoiceObj?.invoiceNumber || (dataObj.invoiceNumber as string) || ''),
      invoiceDate: (dataObj.invoiceDate as string) || invoiceObj?.invoiceDate || new Date().toISOString().split('T')[0],
      dueDate: (dataObj.dueDate as string) || invoiceObj?.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      supplierId: invoiceObj?.supplierId || '',
      notes: (dataObj.notes as string) || invoiceObj?.notes || '',
      documentUrl: invoiceObj?.documentUrl || '',
      items: lineItems.length > 0 ? lineItems : [
        { description: 'Goods received as per invoice', quantity: 1, unitPrice: (dataObj.subtotal as number) || 0, taxRate: 18, discountRate: 0 }
      ],
    });
  }

  const handleReviewDataChange = useCallback((field: string, value: any) => {
    setReviewData((prev) => {
      if (!prev) return { items: [], [field]: value };
      return { ...prev, [field]: value };
    });
  }, []);

  const handleReviewItemChange = useCallback((index: number, field: string, value: any) => {
    setReviewData((prev) => {
      if (!prev || !prev.items) return prev;
      const updated = [...prev.items];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, items: updated };
    });
  }, []);

  const addReviewItem = useCallback(() => {
    setReviewData((prev) => {
      if (!prev) return { items: [{ description: '', quantity: 1, unitPrice: 0, taxRate: 18, discountRate: 0 }] };
      return {
        ...prev,
        items: [...(prev.items || []), { description: '', quantity: 1, unitPrice: 0, taxRate: 18, discountRate: 0 }],
      };
    });
  }, []);

  const removeReviewItem = useCallback((index: number) => {
    setReviewData((prev) => {
      if (!prev || !prev.items) return prev;
      return { ...prev, items: prev.items.filter((_, i) => i !== index) };
    });
  }, []);

  const closeOcrReview = useCallback(() => {
    setShowOcrReview(false);
    setOcrResult(null);
    setReviewData(null);
  }, []);

  const verifyOcrMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => invoiceApi.verifyOcr(id, data),
    onMutate: () => setReviewLoading(true),
    onSuccess: () => {
      toast.success('Invoice verified and stock updated successfully');
      closeOcrReview();
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : 'Failed to verify invoice');
    },
    onSettled: () => setReviewLoading(false),
  });

  const handleVerifyOcr = useCallback((invoiceId: string) => {
    if (!reviewData) return;
    if (!reviewData.invoiceNumber || !reviewData.invoiceDate || !reviewData.dueDate || !reviewData.supplierId) {
      toast.error('Please fill all required fields, including supplier');
      return;
    }
    if (!reviewData.items || reviewData.items.length === 0) {
      toast.error('At least one line item is required');
      return;
    }

    const payload = {
      invoiceNumber: reviewData.invoiceNumber,
      invoiceDate: reviewData.invoiceDate,
      dueDate: reviewData.dueDate,
      supplierId: reviewData.supplierId,
      supplier: { id: reviewData.supplierId },
      notes: reviewData.notes,
      documentUrl: reviewData.documentUrl,
      items: reviewData.items.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate: item.taxRate,
        discountRate: item.discountRate,
      })),
    };

    verifyOcrMutation.mutate({ id: invoiceId, data: payload });
  }, [reviewData, verifyOcrMutation]);

  // Authenticated document viewing via Axios blob retrieval
  const viewDocument = useCallback(async (documentUrl: string | undefined, invoiceId?: string) => {
    if (!documentUrl && !invoiceId) {
      toast.error('No document attached to this invoice');
      return;
    }
    try {
      const url = invoiceId ? `/storage/invoice/${invoiceId}` : `/storage/files/${documentUrl}`;
      const response = await api.get(url, { responseType: 'blob' });
      const contentType = (response.headers['content-type'] as string) || 'application/pdf';
      const blob = new Blob([response.data], { type: contentType });
      const objectUrl = URL.createObjectURL(blob);
      window.open(objectUrl, '_blank');
    } catch {
      toast.error('Failed to load document. Please ensure you have authorized access.');
    }
  }, []);

  // Handle Manual Invoice Submit
  const handleCreateManualInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvoiceData.supplierId) {
      toast.error('Please select a supplier');
      return;
    }
    if (!newInvoiceData.invoiceNumber.trim()) {
      toast.error('Please enter an invoice number');
      return;
    }
    if (newItems.length === 0) {
      toast.error('Please add at least one line item');
      return;
    }

    setSubmittingInvoice(true);
    try {
      const invoicePayload = {
        invoiceNumber: newInvoiceData.invoiceNumber.trim(),
        invoiceDate: newInvoiceData.invoiceDate,
        dueDate: newInvoiceData.dueDate,
        notes: newInvoiceData.notes,
        supplier: { id: newInvoiceData.supplierId } as any,
        items: newItems.map(item => ({
          description: item.description || (item.productId ? products.find(p => p.id === item.productId)?.name : 'Item'),
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxRate: item.taxRate,
          discountRate: item.discountRate,
          product: item.productId ? ({ id: item.productId } as any) : undefined,
        })) as any,
      };

      const res = await invoiceApi.create(invoicePayload);
      const created = res.data;

      if (manualAttachmentFile && created?.id) {
        try {
          await invoiceApi.uploadDocument(created.id, manualAttachmentFile);
        } catch {
          toast.error('Invoice created, but attachment upload failed');
        }
      }

      toast.success('Invoice created successfully');
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      closeModal();

      // Reset state
      setNewInvoiceData({
        supplierId: '',
        invoiceNumber: '',
        invoiceDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: '',
      });
      setNewItems([{ productId: '', description: '', quantity: 1, unitPrice: 0, taxRate: 18, discountRate: 0 }]);
      setManualAttachmentFile(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create invoice');
    } finally {
      setSubmittingInvoice(false);
    }
  };

  // Handle OCR Document Upload Submit
  const handleOcrUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ocrUploadFile) {
      toast.error('Please select an invoice file (PDF, PNG, JPG)');
      return;
    }

    setSubmittingInvoice(true);
    try {
      const res = await invoiceApi.uploadOcrDirect(ocrUploadFile, ocrSupplierId || undefined);
      const resultData = res.data as { invoiceId: string; ocrResult: OcrResult; documentUrl: string };

      toast.success('Document uploaded and OCR processed successfully');
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      closeModal();

      if (resultData?.invoiceId) {
        openOcrReview(resultData.invoiceId);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'OCR upload failed');
    } finally {
      setSubmittingInvoice(false);
      setOcrUploadFile(null);
    }
  };

  const uploadMutation = useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => invoiceApi.uploadDocument(id, file),
    onMutate: ({ id }) => setUploadingInvoiceId(id),
    onSuccess: () => {
      toast.success('Document uploaded and OCR processing started');
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : 'Failed to upload document');
    },
    onSettled: () => setUploadingInvoiceId(null),
  });

  const handleFileUpload = useCallback((invoiceId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('application/pdf') && !file.type.startsWith('image/')) {
      toast.error('Only PDF and image files are allowed');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }
    uploadMutation.mutate({ id: invoiceId, file });
    event.target.value = '';
  }, [uploadMutation]);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => invoiceApi.delete(id),
    onSuccess: () => {
      toast.success('Invoice deleted');
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
    onError: () => toast.error('Failed to delete invoice'),
  });

  const handleDelete = useCallback((id: string) => {
    if (window.confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) {
      deleteMutation.mutate(id);
    }
  }, [deleteMutation]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Supplier Invoices & OCR"
        subtitle="Manage supplier bills, OCR bill verification, inventory stock updates, and accounts payable"
        breadcrumbs={[
          { label: 'Financials' },
          { label: 'Invoices' },
        ]}
        actions={
          <Button 
            onClick={() => { setViewingInvoice(null); setEditingInvoice(null); setShowModal(true); }} 
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            className="shadow-sm"
          >
            Add Invoice
          </Button>
        }
      />

      {/* Invoice Filter Bar */}
      <Card>
        <CardBody className="p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-secondary-400" />
              <Input
                placeholder="Search invoice number, supplier..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="w-full md:w-48">
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[{ value: '', label: 'All Statuses' }, ...statusOptions]}
              />
            </div>
            <div className="w-full md:w-48">
              <Select
                value={ocrStatusFilter}
                onChange={(e) => setOcrStatusFilter(e.target.value)}
                options={[{ value: '', label: 'All OCR States' }, ...ocrStatusOptions]}
              />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Invoice Table */}
      <Card>
        <CardBody className="p-0">
          <DataTable
            data={data || []}
            columns={[
              {
                key: 'invoiceNumber',
                header: 'Invoice #',
                render: (row) => (
                  <div>
                    <span className="font-semibold text-secondary-900 font-mono text-xs">{row.invoiceNumber}</span>
                    {row.supplierName && (
                      <p className="text-xs text-secondary-500 mt-0.5">{row.supplierName}</p>
                    )}
                  </div>
                ),
              },
              {
                key: 'invoiceDate',
                header: 'Date',
                render: (row) => formatDate(row.invoiceDate),
              },
              {
                key: 'dueDate',
                header: 'Due Date',
                render: (row) => formatDate(row.dueDate),
              },
              {
                key: 'totalAmount',
                header: 'Total Amount',
                align: 'right',
                render: (row) => <span className="font-mono font-semibold">{formatCurrency(row.totalAmount)}</span>,
              },
              {
                key: 'outstandingAmount',
                header: 'Outstanding',
                align: 'right',
                render: (row) => (
                  <span className={`font-mono font-semibold ${Number(row.outstandingAmount) > 0 ? 'text-danger-600' : 'text-success-600'}`}>
                    {formatCurrency(row.outstandingAmount)}
                  </span>
                ),
              },
              {
                key: 'status',
                header: 'Status',
                render: (row) => (
                  <Badge variant={getStatusBadgeVariant(row.status)} size="sm">
                    {row.status}
                  </Badge>
                ),
              },
              {
                key: 'ocrStatus',
                header: 'OCR',
                render: (row) => (
                  <Badge variant={getOcrBadgeVariant(row.ocrStatus)} size="sm">
                    {row.ocrStatus}
                  </Badge>
                ),
              },
              {
                key: 'actions',
                header: 'Actions',
                align: 'right',
                render: (row) => (
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { setViewingInvoice(row); setShowModal(true); }}
                      aria-label="View invoice details"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    {row.documentUrl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => viewDocument(row.documentUrl, row.id)}
                        aria-label="View original invoice document"
                        className="text-primary-600 hover:text-primary-800"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    )}
                    {row.ocrStatus === 'COMPLETED' && row.status === 'PROCESSING' && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => openOcrReview(row.id)}
                        className="text-xs px-2 py-1"
                      >
                        Verify OCR
                      </Button>
                    )}
                    {row.status !== 'VERIFIED' && row.status !== 'PAID' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(row.id)}
                        className="text-danger-600 hover:bg-danger-50"
                        aria-label="Delete invoice"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ),
              },
            ]}
            keyExtractor={(row) => row.id}
            pagination={{
              enabled: true,
              pageSize,
              currentPage: page,
              totalItems: data?.length || 0,
              onPageChange: (newPage) => setPage(newPage),
            }}
            emptyMessage="No invoices found."
          />
        </CardBody>
      </Card>

      {/* Main Modal: Add Invoice OR View Invoice */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={viewingInvoice ? `Invoice Details: ${viewingInvoice.invoiceNumber}` : 'Create Supplier Invoice'}
        size="xl"
      >
        {viewingInvoice ? (
          <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-3 bg-secondary-50 rounded-lg">
              <div>
                <label className="block text-xs font-semibold uppercase text-secondary-500 mb-1">Invoice Number</label>
                <p className="font-mono font-bold text-secondary-900">{viewingInvoice.invoiceNumber}</p>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-secondary-500 mb-1">Invoice Date</label>
                <p className="text-secondary-900">{formatDate(viewingInvoice.invoiceDate)}</p>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-secondary-500 mb-1">Due Date</label>
                <p className="text-secondary-900">{formatDate(viewingInvoice.dueDate)}</p>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-secondary-500 mb-1">Status</label>
                <Badge variant={getStatusBadgeVariant(viewingInvoice.status)} size="sm">
                  {viewingInvoice.status}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Input label="Subtotal" value={formatCurrency(viewingInvoice.subtotal)} disabled className="bg-secondary-50 font-mono" />
              <Input label="Tax Amount" value={formatCurrency(viewingInvoice.taxAmount)} disabled className="bg-secondary-50 font-mono" />
              <Input label="Discount" value={formatCurrency(viewingInvoice.discountAmount)} disabled className="bg-secondary-50 font-mono" />
              <Input label="Total Amount" value={formatCurrency(viewingInvoice.totalAmount)} disabled className="bg-secondary-50 font-mono font-bold" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input label="Paid Amount" value={formatCurrency(viewingInvoice.paidAmount)} disabled className="bg-secondary-50 font-mono" />
              <Input label="Outstanding" value={formatCurrency(viewingInvoice.outstandingAmount)} disabled className="bg-secondary-50 font-mono font-bold text-danger-700" />
            </div>

            {viewingInvoice.documentUrl && (
              <div className="flex items-center justify-between p-3 bg-primary-50 rounded-lg border border-primary-100">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary-700" />
                  <span className="text-sm font-medium text-primary-900">Original Document Attached</span>
                </div>
                <Button variant="secondary" size="sm" onClick={() => viewDocument(viewingInvoice.documentUrl, viewingInvoice.id)} leftIcon={<ExternalLink className="w-4 h-4" />}>
                  View Document
                </Button>
              </div>
            )}

            <h4 className="font-semibold text-secondary-900 pt-2 border-t border-secondary-200">Line Items</h4>
            <DataTable
              data={viewingInvoice.items || []}
              columns={[
                { key: 'description', header: 'Description' },
                { key: 'quantity', header: 'Qty', align: 'center', width: '70px' },
                { key: 'unitPrice', header: 'Price', align: 'right', render: (row) => formatCurrency(row.unitPrice) },
                { key: 'taxRate', header: 'Tax %', align: 'center', width: '70px', render: (row) => `${row.taxRate}%` },
                { key: 'discountRate', header: 'Disc %', align: 'center', width: '70px', render: (row) => `${row.discountRate}%` },
                { key: 'lineTotal', header: 'Total', align: 'right', render: (row) => formatCurrency(row.lineTotal) },
              ]}
              keyExtractor={(row) => row.id}
              pagination={{ enabled: false }}
              emptyMessage="No items recorded on this invoice."
            />

            <div className="flex justify-end gap-3 pt-4 border-t border-secondary-200">
              <Button type="button" variant="secondary" onClick={closeModal}>Close</Button>
            </div>
          </div>
        ) : (
          /* Add Invoice View */
          <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
            {/* Mode Switcher */}
            <div className="flex border-b border-secondary-200">
              <button
                type="button"
                onClick={() => setModalTab('manual')}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  modalTab === 'manual'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-secondary-500 hover:text-secondary-700'
                }`}
              >
                <FileCheck2 className="w-4 h-4" />
                Manual Entry
              </button>
              <button
                type="button"
                onClick={() => setModalTab('ocr')}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  modalTab === 'ocr'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-secondary-500 hover:text-secondary-700'
                }`}
              >
                <Upload className="w-4 h-4" />
                OCR Document Upload
              </button>
            </div>

            {modalTab === 'manual' ? (
              <form onSubmit={handleCreateManualInvoice} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    label="Supplier *"
                    value={newInvoiceData.supplierId}
                    onChange={(e) => setNewInvoiceData({ ...newInvoiceData, supplierId: e.target.value })}
                    options={supplierOptions}
                    placeholder="Select supplier"
                    required
                  />
                  <Input
                    label="Invoice Number *"
                    value={newInvoiceData.invoiceNumber}
                    onChange={(e) => setNewInvoiceData({ ...newInvoiceData, invoiceNumber: e.target.value })}
                    placeholder="e.g. INV-2024-884"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Invoice Date *"
                    type="date"
                    value={newInvoiceData.invoiceDate}
                    onChange={(e) => setNewInvoiceData({ ...newInvoiceData, invoiceDate: e.target.value })}
                    required
                  />
                  <Input
                    label="Due Date *"
                    type="date"
                    value={newInvoiceData.dueDate}
                    onChange={(e) => setNewInvoiceData({ ...newInvoiceData, dueDate: e.target.value })}
                    required
                  />
                </div>

                <Input
                  label="Notes / Comments"
                  value={newInvoiceData.notes}
                  onChange={(e) => setNewInvoiceData({ ...newInvoiceData, notes: e.target.value })}
                  placeholder="Optional billing or transport notes..."
                />

                {/* Optional File Attachment */}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Invoice File Attachment (Optional PDF / Image)
                  </label>
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    onChange={(e) => setManualAttachmentFile(e.target.files?.[0] || null)}
                    className="block w-full text-sm text-secondary-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                  />
                </div>

                {/* Line Items */}
                <div className="pt-3 border-t border-secondary-200">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-secondary-900">Line Items</h4>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setNewItems([...newItems, { productId: '', description: '', quantity: 1, unitPrice: 0, taxRate: 18, discountRate: 0 }])}
                      leftIcon={<Plus className="w-4 h-4" />}
                    >
                      Add Item
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {newItems.map((item, idx) => {
                      const lineBase = item.quantity * item.unitPrice;
                      const lineDisc = lineBase * (item.discountRate / 100);
                      const lineTax = (lineBase - lineDisc) * (item.taxRate / 100);
                      const computedLineTotal = lineBase - lineDisc + lineTax;

                      return (
                        <div key={idx} className="p-3 bg-secondary-50 rounded-lg border border-secondary-200 grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
                          <div className="md:col-span-2">
                            <Select
                              label="Product Catalog (Optional)"
                              value={item.productId}
                              onChange={(e) => {
                                const prod = products.find(p => p.id === e.target.value);
                                const updated = [...newItems];
                                updated[idx].productId = e.target.value;
                                if (prod) {
                                  updated[idx].description = prod.name;
                                  if (prod.purchasePrice) updated[idx].unitPrice = prod.purchasePrice;
                                }
                                setNewItems(updated);
                              }}
                              options={productOptions}
                            />
                            <Input
                              label="Description *"
                              value={item.description}
                              onChange={(e) => {
                                const updated = [...newItems];
                                updated[idx].description = e.target.value;
                                setNewItems(updated);
                              }}
                              placeholder="Item description"
                              className="mt-1"
                              required
                            />
                          </div>
                          <div>
                            <Input
                              label="Qty *"
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => {
                                const updated = [...newItems];
                                updated[idx].quantity = Math.max(1, parseInt(e.target.value) || 1);
                                setNewItems(updated);
                              }}
                              required
                            />
                          </div>
                          <div>
                            <Input
                              label="Unit Price *"
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.unitPrice}
                              onChange={(e) => {
                                const updated = [...newItems];
                                updated[idx].unitPrice = Math.max(0, parseFloat(e.target.value) || 0);
                                setNewItems(updated);
                              }}
                              required
                            />
                          </div>
                          <div>
                            <Input
                              label="Tax %"
                              type="number"
                              step="0.01"
                              min="0"
                              max="100"
                              value={item.taxRate}
                              onChange={(e) => {
                                const updated = [...newItems];
                                updated[idx].taxRate = parseFloat(e.target.value) || 0;
                                setNewItems(updated);
                              }}
                            />
                            <Input
                              label="Disc %"
                              type="number"
                              step="0.01"
                              min="0"
                              max="100"
                              value={item.discountRate}
                              onChange={(e) => {
                                const updated = [...newItems];
                                updated[idx].discountRate = parseFloat(e.target.value) || 0;
                                setNewItems(updated);
                              }}
                              className="mt-1"
                            />
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <span className="block text-xs text-secondary-500 font-medium">Total</span>
                              <span className="font-mono text-xs font-bold text-secondary-900">
                                {formatCurrency(computedLineTotal)}
                              </span>
                            </div>
                            {newItems.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setNewItems(newItems.filter((_, i) => i !== idx))}
                                className="text-danger-600 hover:bg-danger-50"
                                aria-label="Remove item"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Totals Summary */}
                <div className="p-4 bg-secondary-100 rounded-lg flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="flex gap-6 text-sm text-secondary-700">
                    <div>Subtotal: <span className="font-mono font-bold text-secondary-900">{formatCurrency(manualTotals.subtotal)}</span></div>
                    <div>Discount: <span className="font-mono font-bold text-danger-700">-{formatCurrency(manualTotals.totalDiscount)}</span></div>
                    <div>Tax: <span className="font-mono font-bold text-secondary-900">+{formatCurrency(manualTotals.totalTax)}</span></div>
                  </div>
                  <div className="text-lg font-bold text-secondary-900 font-mono">
                    Total: {formatCurrency(manualTotals.grandTotal)}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-secondary-200">
                  <Button type="button" variant="secondary" onClick={closeModal} disabled={submittingInvoice}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" loading={submittingInvoice} disabled={submittingInvoice}>
                    Create Invoice
                  </Button>
                </div>
              </form>
            ) : (
              /* OCR Document Upload Tab */
              <form onSubmit={handleOcrUploadSubmit} className="space-y-4">
                <div className="p-4 bg-primary-50 rounded-lg border border-primary-100 text-sm text-primary-800">
                  <p className="font-medium mb-1">Automated Invoice AI Extraction</p>
                  <p className="text-xs text-primary-700">
                    Upload an invoice PDF or photo. ThreadPilot will automatically extract the invoice number, line items, pricing, tax rates, and totals. You will have full verification control before items are committed to inventory.
                  </p>
                </div>

                <Select
                  label="Associated Supplier (Optional)"
                  value={ocrSupplierId}
                  onChange={(e) => setOcrSupplierId(e.target.value)}
                  options={[{ value: '', label: 'Auto-detect from OCR or assign later' }, ...supplierOptions]}
                />

                <div className="border-2 border-dashed border-secondary-300 rounded-xl p-8 text-center hover:border-primary-500 transition-colors bg-secondary-50/50">
                  <Upload className="w-10 h-10 mx-auto mb-3 text-secondary-400" />
                  <p className="text-sm font-medium text-secondary-800 mb-1">
                    {ocrUploadFile ? ocrUploadFile.name : 'Select or drop invoice document'}
                  </p>
                  <p className="text-xs text-secondary-500 mb-4">Supported formats: PDF, JPEG, PNG (max 10MB)</p>
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    id="ocr-file-upload"
                    className="sr-only"
                    onChange={(e) => setOcrUploadFile(e.target.files?.[0] || null)}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => document.getElementById('ocr-file-upload')?.click()}
                  >
                    {ocrUploadFile ? 'Change File' : 'Browse Files'}
                  </Button>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-secondary-200">
                  <Button type="button" variant="secondary" onClick={closeModal} disabled={submittingInvoice}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    loading={submittingInvoice}
                    disabled={submittingInvoice || !ocrUploadFile}
                  >
                    Upload & Extract with OCR
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}
      </Modal>

      {/* OCR Review & Verification Modal */}
      <Modal
        isOpen={showOcrReview}
        onClose={closeOcrReview}
        title="Review & Verify Invoice"
        size="xl"
      >
        {ocrResult ? (
          <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-primary-600" />
                  <h4 className="font-medium text-primary-900">Review OCR Results</h4>
                </div>
                <div className="flex items-center gap-2 text-sm text-primary-700">
                  <span className="font-medium">Confidence:</span>
                  <span>{ocrResult.confidence ? `${(ocrResult.confidence * 100).toFixed(1)}%` : 'N/A'}</span>
                  {ocrResult.rawText && (
                    <React.Fragment>
                      <span className="mx-2 text-primary-300">|</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => { 
                          navigator.clipboard.writeText(ocrResult.rawText!); 
                          toast.success('Raw text copied to clipboard'); 
                        }} 
                        leftIcon={<FileQuestion className="w-3 h-3" />}
                      >
                        Copy Raw Text
                      </Button>
                    </React.Fragment>
                  )}
                </div>
              </div>
            </div>

            <form 
              onSubmit={(e) => { 
                e.preventDefault(); 
                if (viewingInvoice) {
                  handleVerifyOcr(viewingInvoice.id);
                }
              }} 
              className="space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Invoice Number *"
                  value={reviewData?.invoiceNumber || ''}
                  onChange={(e) => handleReviewDataChange('invoiceNumber', e.target.value)}
                  placeholder="e.g. INV-2024-001"
                  disabled={reviewLoading}
                  required
                />
                <Select
                  label="Supplier *"
                  value={reviewData?.supplierId || ''}
                  onChange={(e) => handleReviewDataChange('supplierId', e.target.value)}
                  options={supplierOptions}
                  placeholder="Select supplier"
                  disabled={reviewLoading}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Invoice Date *"
                  type="date"
                  value={reviewData?.invoiceDate || ''}
                  onChange={(e) => handleReviewDataChange('invoiceDate', e.target.value)}
                  disabled={reviewLoading}
                  required
                />
                <Input
                  label="Due Date *"
                  type="date"
                  value={reviewData?.dueDate || ''}
                  onChange={(e) => handleReviewDataChange('dueDate', e.target.value)}
                  disabled={reviewLoading}
                  required
                />
              </div>

              <Input
                label="Notes"
                value={reviewData?.notes || ''}
                onChange={(e) => handleReviewDataChange('notes', e.target.value)}
                placeholder="Additional notes"
                disabled={reviewLoading}
              />

              <div className="pt-3 border-t border-secondary-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-secondary-900">Extracted Line Items</h4>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={addReviewItem}
                    disabled={reviewLoading}
                    leftIcon={<Plus className="w-4 h-4" />}
                  >
                    Add Item
                  </Button>
                </div>

                <div className="space-y-3">
                  {reviewData?.items?.map((item, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-6 gap-3 p-3 bg-secondary-50 rounded-lg border border-secondary-200 items-end">
                      <div className="md:col-span-2">
                        <Input
                          label="Description *"
                          value={item.description || ''}
                          onChange={(e) => handleReviewItemChange(index, 'description', e.target.value)}
                          placeholder="Item description"
                          disabled={reviewLoading}
                          required
                        />
                      </div>
                      <div>
                        <Input
                          label="Qty *"
                          type="number"
                          min="1"
                          value={item.quantity || 1}
                          onChange={(e) => handleReviewItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                          disabled={reviewLoading}
                          required
                        />
                      </div>
                      <div>
                        <Input
                          label="Unit Price *"
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.unitPrice || 0}
                          onChange={(e) => handleReviewItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                          disabled={reviewLoading}
                          required
                        />
                      </div>
                      <div>
                        <Input
                          label="Tax %"
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={item.taxRate || 0}
                          onChange={(e) => handleReviewItemChange(index, 'taxRate', parseFloat(e.target.value) || 0)}
                          disabled={reviewLoading}
                        />
                        <Input
                          label="Disc %"
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={item.discountRate || 0}
                          onChange={(e) => handleReviewItemChange(index, 'discountRate', parseFloat(e.target.value) || 0)}
                          disabled={reviewLoading}
                          className="mt-1"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <span className="block text-xs text-secondary-500 font-medium">Total</span>
                          <span className="font-mono text-xs font-bold text-secondary-900">
                            {formatCurrency(((item.quantity || 1) * (item.unitPrice || 0)) * (1 - (item.discountRate || 0) / 100) * (1 + (item.taxRate || 0) / 100))}
                          </span>
                        </div>
                        {reviewData.items.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeReviewItem(index)}
                            disabled={reviewLoading}
                            className="text-danger-600 hover:bg-danger-50"
                            aria-label="Remove item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-secondary-200">
                <Button type="button" variant="secondary" onClick={closeOcrReview} disabled={reviewLoading}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  loading={reviewLoading}
                  disabled={reviewLoading}
                >
                  Verify & Commit to Inventory
                </Button>
              </div>
            </form>
          </div>
        ) : (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 mx-auto mb-4 text-primary-600 animate-spin" />
            <p className="text-secondary-600">Loading OCR results...</p>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Invoices;
