import React, { useState, useCallback } from 'react';
import { Search, Filter, FileText, Plus, Edit, Trash2, Eye, ChevronDown, Upload, AlertTriangle, Save, X, Loader2, Download, ExternalLink, Clock, CreditCard, AlertCircle, CheckCircle, FileQuestion } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { DataTable } from '../components/tables/DataTable';
import { Badge } from '../components/ui/Badge';
import { PageHeader } from '../components/ui/PageHeader';
import { invoiceApi } from '../api/endpoints';
import type { SupplierInvoice, PaginatedResponse, OcrResult, OcrLineItem, SupplierInvoiceItem } from '../types';
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

const formatCurrency = (value: number) => `₹${Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString();

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case 'PAID': return 'success';
    case 'OVERDUE': return 'danger';
    case 'PARTIALLY_PAID': return 'warning';
    case 'DRAFT': return 'secondary';
    case 'PROCESSING': return 'info';
    case 'VERIFIED': return 'primary';
    default: return 'secondary';
  }
};

const getOcrStatusBadgeVariant = (status: string) => {
  switch (status) {
    case 'COMPLETED':
    case 'VERIFIED': return 'success';
    case 'FAILED': return 'danger';
    case 'PROCESSING': return 'info';
    default: return 'secondary';
  }
};

const getOcrStatusIcon = (status: string) => {
  switch (status) {
    case 'COMPLETED':
    case 'VERIFIED': return <CheckCircle className="w-4 h-4" />;
    case 'FAILED': return <AlertCircle className="w-4 h-4" />;
    case 'PROCESSING': return <Loader2 className="w-4 h-4 animate-spin" />;
    default: return <Clock className="w-4 h-4" />;
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

  const { data, isLoading, error, refetch } = useQuery<SupplierInvoice[]>({
    queryKey: ['invoices', page, pageSize, search, statusFilter, ocrStatusFilter],
    queryFn: async () => {
      const res = await invoiceApi.list({ page, size: pageSize, status: statusFilter, ocrStatus: ocrStatusFilter });
      const pageData = res.data as PaginatedResponse<SupplierInvoice> | undefined;
      return pageData?.content || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<SupplierInvoice>) => invoiceApi.create(data),
    onSuccess: () => {
      toast.success('Invoice created successfully');
      closeModal();
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Failed to create invoice');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<SupplierInvoice> }) => invoiceApi.update(id, data),
    onSuccess: () => {
      toast.success('Invoice updated successfully');
      closeModal();
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Failed to update invoice');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => invoiceApi.delete(id),
    onSuccess: () => {
      toast.success('Invoice deleted');
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
    onError: () => toast.error('Failed to delete invoice'),
  });

  const uploadMutation = useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => invoiceApi.uploadDocument(id, file),
    onMutate: ({ id }) => {
      setUploadingInvoiceId(id);
    },
    onSuccess: () => {
      toast.success('Document uploaded and OCR processing started');
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Failed to upload document');
    },
    onSettled: () => {
      setUploadingInvoiceId(null);
    },
  });

  const ocrMutation = useMutation({
    mutationFn: (id: string) => invoiceApi.processOcr(id),
    onMutate: (id) => {
      setOcrProcessingInvoiceId(id);
    },
    onSuccess: () => {
      toast.success('OCR processing started');
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Failed to process OCR');
    },
    onSettled: () => {
      setOcrProcessingInvoiceId(null);
    },
  });

  const reprocessOcrMutation = useMutation({
    mutationFn: (id: string) => invoiceApi.reprocessOcr(id),
    onMutate: (id) => {
      setOcrProcessingInvoiceId(id);
    },
    onSuccess: () => {
      toast.success('OCR reprocessing completed');
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Failed to reprocess OCR');
    },
    onSettled: () => {
      setOcrProcessingInvoiceId(null);
    },
  });

  const closeModal = useCallback(() => {
    setShowModal(false);
    setEditingInvoice(null);
    setViewingInvoice(null);
  }, []);

  const handleDelete = useCallback((id: string) => {
    if (window.confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) {
      deleteMutation.mutate(id);
    }
  }, []);

  const openOcrReview = useCallback(async (invoiceId: string) => {
    try {
      const result = await invoiceApi.getOcrResult(invoiceId);
      const ocrData = result.data;
      setOcrResult(ocrData);
      loadReviewData(ocrData);
      setShowOcrReview(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load OCR result');
    }
  }, []);

  function loadReviewData(ocrResult: any) {
    if (!ocrResult.structuredData) {
      setReviewData({
        invoiceNumber: '',
        invoiceDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        supplierId: '',
        notes: '',
        documentUrl: '',
        items: [],
      });
      return;
    }
    const data = ocrResult.structuredData as Record<string, unknown>;
    const lineItems = ((data.lineItems as OcrLineItem[]) || []).map((item) => ({
      description: item.description || '',
      quantity: item.quantity ?? 1,
      unitPrice: item.unitPrice ?? 0,
      taxRate: item.taxRate ?? 0,
      discountRate: item.discountRate ?? 0,
    }));
    setReviewData({
      invoiceNumber: (data.invoiceNumber as string) || '',
      invoiceDate: (data.invoiceDate as string) || new Date().toISOString().split('T')[0],
      dueDate: (data.dueDate as string) || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      supplierId: '',
      notes: (data.notes as string) || '',
      documentUrl: '',
      items: lineItems,
    });
  }

  const handleReviewDataChange = useCallback((field: string, value: any) => {
    setReviewData((prev) => {
      if (!prev) return { items: [], [field]: value };
      return { ...prev, [field]: value };
    });
  }, []);

  const handleItemChange = useCallback((index: number, field: string, value: any) => {
    setReviewData((prev) => {
      if (!prev) return { items: [], description: '', quantity: 1, unitPrice: 0, taxRate: 0, discountRate: 0 };
      if (!prev.items) return prev;
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], [field]: value };
      return { ...prev, items: newItems };
    });
  }, []);

  const addItem = useCallback(() => {
    setReviewData((prev) => {
      if (!prev) return { items: [{ description: '', quantity: 1, unitPrice: 0, taxRate: 0, discountRate: 0 }] };
      return {
        ...prev,
        items: [...(prev.items || []), { description: '', quantity: 1, unitPrice: 0, taxRate: 0, discountRate: 0 }],
      };
    });
  }, []);

  const removeItem = useCallback((index: number) => {
    setReviewData((prev) => {
      if (!prev || !prev.items) return prev;
      const newItems = prev.items.filter((_, i) => i !== index);
      return { ...prev, items: newItems };
    });
  }, []);

  const verifyOcrMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => invoiceApi.verifyOcr(id, data),
    onMutate: () => {
      setReviewLoading(true);
    },
    onSuccess: () => {
      toast.success('Invoice verified successfully');
      closeOcrReview();
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Failed to verify invoice');
    },
    onSettled: () => {
      setReviewLoading(false);
    },
  });

  const verifyMutation = useMutation({
    mutationFn: (id: string) => invoiceApi.verify(id),
    onMutate: () => {
      setReviewLoading(true);
    },
    onSuccess: () => {
      toast.success('Invoice verified successfully');
      closeOcrReview();
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Failed to verify invoice');
    },
    onSettled: () => {
      setReviewLoading(false);
    },
  });

  const addItemMutation = useMutation({
    mutationFn: ({ id, item }: { id: string; item: Partial<SupplierInvoiceItem> }) => invoiceApi.addItem(id, item),
    onMutate: () => {
      setReviewLoading(true);
    },
    onSuccess: () => {
      toast.success('Item added successfully');
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Failed to add item');
    },
    onSettled: () => {
      setReviewLoading(false);
    },
  });

  const handleVerifyOcr = useCallback((invoiceId: string) => {
    if (!reviewData) return;
    if (!reviewData.invoiceNumber || !reviewData.invoiceDate || !reviewData.dueDate || !reviewData.supplierId) {
      toast.error('Please fill all required fields');
      return;
    }
    if (!reviewData.items || reviewData.items.length === 0) {
      toast.error('At least one line item is required');
      return;
    }
    const supplierInvoiceItems = reviewData.items.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      taxRate: item.taxRate,
      discountRate: item.discountRate,
    }));
    const dataToSubmit = {
      invoiceNumber: reviewData.invoiceNumber,
      invoiceDate: reviewData.invoiceDate,
      dueDate: reviewData.dueDate,
      supplierId: reviewData.supplierId,
      notes: reviewData.notes,
      documentUrl: reviewData.documentUrl,
      items: supplierInvoiceItems,
    };
    verifyOcrMutation.mutate({ id: invoiceId, data: dataToSubmit });
  }, [reviewData]);

  const closeOcrReview = useCallback(() => {
    setShowOcrReview(false);
    setOcrResult(null);
    setReviewData(null);
  }, []);

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
  }, []);

  const viewDocument = useCallback((documentUrl: string | undefined) => {
    if (documentUrl) {
      // Use the storage API endpoint to serve the document
      const apiUrl = `/api/storage/files/${encodeURIComponent(documentUrl)}`;
      window.open(apiUrl, '_blank');
    } else {
      toast.error('No document available');
    }
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

  const invoices = data || [];
  const totalItems = data?.length || 0;
  const totalInvoiced = invoices.reduce((acc, inv) => acc + Number(inv.totalAmount || 0), 0);
  const totalOutstanding = invoices.reduce((acc, inv) => acc + Number(inv.outstandingAmount || 0), 0);
  const verifiedCount = invoices.filter(inv => inv.ocrStatus === 'VERIFIED' || inv.status === 'VERIFIED').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Supplier Invoices"
        description="Supplier tax invoices, intelligent OCR data capture, line-item reconciliation, and AP audit"
        breadcrumbs={[
          { label: 'Financials' },
          { label: 'Invoices' },
        ]}
        actions={
          <Button 
            onClick={() => { setEditingInvoice(null); setShowModal(true); }} 
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            className="shadow-sm"
          >
            Add Invoice
          </Button>
        }
      />

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white border border-navy-100 rounded-xl shadow-card flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-navy-50 text-navy-700 flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-navy-500">Total Invoiced</p>
            <p className="text-xl font-bold text-navy-900 font-mono tabular-nums">
              ₹{totalInvoiced.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <div className="p-4 bg-white border border-navy-100 rounded-xl shadow-card flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-danger-50 text-danger-700 flex items-center justify-center flex-shrink-0">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-navy-500">Outstanding Payables</p>
            <p className="text-xl font-bold text-danger-800 font-mono tabular-nums">
              ₹{totalOutstanding.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <div className="p-4 bg-white border border-navy-100 rounded-xl shadow-card flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-success-50 text-success-700 flex items-center justify-center flex-shrink-0">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-navy-500">Verified Vouchers</p>
            <p className="text-xl font-bold text-success-800 font-mono tabular-nums">
              {verifiedCount} Verified
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardBody className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400 w-4 h-4" />
              <Input
                placeholder="Search invoices by number..."
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
              <Select
                value={ocrStatusFilter}
                onChange={(e) => { setOcrStatusFilter(e.target.value); setPage(1); }}
                options={[{ value: '', label: 'All OCR Status' }, ...ocrStatusOptions]}
                placeholder="Filter by OCR"
                className="w-full sm:w-40"
              />
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="p-0">
          {error ? (
            <div className="p-6 text-center text-red-600">Failed to load invoices</div>
          ) : (
            <DataTable<SupplierInvoice>
              data={invoices}
              columns={[
                { key: 'invoiceNumber', header: 'Invoice #', width: '140px' },
                { key: 'invoiceDate', header: 'Invoice Date', width: '120px', render: (row) => formatDate(row.invoiceDate) },
                { key: 'dueDate', header: 'Due Date', width: '120px', render: (row) => formatDate(row.dueDate) },
                {
                  key: 'supplierId',
                  header: 'Supplier',
                  width: '140px',
                  render: (row: SupplierInvoice) => (
                    <span className="font-mono text-xs text-secondary-700" title={row.supplierId}>
                      {row.supplierId.slice(0, 8)}...
                    </span>
                  ),
                },
                {
                  key: 'status',
                  header: 'Status',
                  width: '140px',
                  render: (row: SupplierInvoice) => (
                    <Badge variant={getStatusBadgeVariant(row.status)}>
                      {row.status.replace(/_/g, ' ')}
                    </Badge>
                  ),
                },
                {
                  key: 'ocrStatus',
                  header: 'OCR',
                  width: '130px',
                  render: (row: SupplierInvoice) => (
                    <span className="inline-flex items-center gap-1">
                      <Badge variant={getOcrStatusBadgeVariant(row.ocrStatus)}>
                        {getOcrStatusIcon(row.ocrStatus)}
                        {row.ocrStatus.replace(/_/g, ' ')}
                      </Badge>
                    </span>
                  ),
                },
                { key: 'totalAmount', header: 'Total', align: 'right', width: '120px', render: (row) => formatCurrency(row.totalAmount) },
                {
                  key: 'outstandingAmount',
                  header: 'Outstanding',
                  align: 'right',
                  width: '130px',
                  render: (row) => (
                    <span className={Number(row.outstandingAmount) > 0 ? 'font-medium text-red-600' : 'font-medium text-green-600'}>
                      {formatCurrency(row.outstandingAmount)}
                    </span>
                  ),
                },
                {
                  key: 'actions',
                  header: 'Actions',
                  width: '220px',
                  render: (row) => (
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { setViewingInvoice(row); setShowModal(true); }}
                        aria-label="View invoice"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {row.documentUrl && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => viewDocument(row.documentUrl)}
                          aria-label="View document"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      )}
                      <div className="relative">
                        <input
                          type="file"
                          accept=".pdf,image/*"
                          onChange={(e) => handleFileUpload(row.id, e)}
                          className="sr-only"
                          id={`upload-${row.id}`}
                          disabled={uploadingInvoiceId === row.id || ocrProcessingInvoiceId === row.id}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => document.getElementById(`upload-${row.id}`)?.click()}
                          disabled={uploadingInvoiceId === row.id || ocrProcessingInvoiceId === row.id}
                          aria-label="Upload document"
                          leftIcon={uploadingInvoiceId === row.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                        >
                          Upload
                        </Button>
                      </div>
                      {row.ocrStatus === 'PENDING' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => ocrMutation.mutate(row.id)}
                          disabled={ocrProcessingInvoiceId === row.id}
                          className="text-primary-600 hover:bg-primary-50"
                          leftIcon={ocrProcessingInvoiceId === row.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <AlertTriangle className="w-3 h-3" />}
                        >
                          OCR
                        </Button>
                      )}
                      {row.ocrStatus === 'COMPLETED' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openOcrReview(row.id)}
                          className="text-primary-600 hover:bg-primary-50"
                          leftIcon={<AlertTriangle className="w-3 h-3" />}
                        >
                          Review
                        </Button>
                      )}
                      {(row.ocrStatus as string) === 'VERIFIED' && (
                        <Badge variant="success" className="text-xs">
                          Verified
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(row.id)}
                        disabled={['VERIFIED', 'PAID', 'PARTIALLY_PAID'].includes(row.status)}
                        aria-label="Delete invoice"
                        className="text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
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
              emptyMessage="No invoices found"
            />
          )}
        </CardBody>
      </Card>

      <Modal
        isOpen={showModal && (!!editingInvoice || !!viewingInvoice)}
        onClose={closeModal}
        title={viewingInvoice ? `Invoice: ${viewingInvoice.invoiceNumber}` : editingInvoice ? 'Edit Invoice' : 'Add Invoice'}
        size="xl"
      >
        {viewingInvoice ? (
          <div className="space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Invoice Number</label>
                <p className="font-mono text-secondary-900">{viewingInvoice.invoiceNumber}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Invoice Date</label>
                <p className="text-secondary-900">{formatDate(viewingInvoice.invoiceDate)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Due Date</label>
                <p className="text-secondary-900">{formatDate(viewingInvoice.dueDate)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Supplier</label>
                <p className="text-secondary-900 font-mono text-xs">{viewingInvoice.supplierId}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Select
                label="Status"
                value={viewingInvoice.status}
                onChange={(e) => setViewingInvoice({ ...viewingInvoice, status: e.target.value as typeof viewingInvoice.status })}
                options={statusOptions}
                disabled={viewingInvoice.status !== 'DRAFT' && viewingInvoice.status !== 'PROCESSING'}
              />
              <Select
                label="OCR Status"
                value={viewingInvoice.ocrStatus}
                onChange={(e) => setViewingInvoice({ ...viewingInvoice, ocrStatus: e.target.value as typeof viewingInvoice.ocrStatus })}
                options={ocrStatusOptions}
                disabled={viewingInvoice.status !== 'DRAFT' && viewingInvoice.status !== 'PROCESSING'}
              />
              {viewingInvoice.ocrConfidence && (
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">OCR Confidence</label>
                  <p className="text-secondary-900">{viewingInvoice.ocrConfidence}%</p>
                </div>
              )}
              {viewingInvoice.documentUrl && (
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Document</label>
                  <Button variant="ghost" size="sm" onClick={() => viewDocument(viewingInvoice.documentUrl)} leftIcon={<ExternalLink className="w-3 h-3" />}>
                    View Document
                  </Button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Input label="Subtotal" type="number" step="0.01" value={viewingInvoice.subtotal} disabled className="bg-secondary-50" />
              <Input label="Tax Amount" type="number" step="0.01" value={viewingInvoice.taxAmount} disabled className="bg-secondary-50" />
              <Input label="Discount" type="number" step="0.01" value={viewingInvoice.discountAmount} disabled className="bg-secondary-50" />
              <Input label="Total Amount" type="number" step="0.01" value={viewingInvoice.totalAmount} disabled className="bg-secondary-50 font-bold" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Input label="Paid Amount" type="number" step="0.01" value={viewingInvoice.paidAmount} disabled className="bg-secondary-50" />
              <Input label="Outstanding" type="number" step="0.01" value={viewingInvoice.outstandingAmount} disabled className={`bg-secondary-50 font-bold ${Number(viewingInvoice.outstandingAmount) > 0 ? 'text-red-600' : 'text-green-600'}`} />
            </div>

            {viewingInvoice.notes && (
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Notes</label>
                <p className="text-secondary-600">{viewingInvoice.notes}</p>
              </div>
            )}

            <h4 className="font-medium text-secondary-900 pt-4 border-t border-secondary-200 flex items-center justify-between">
              Invoice Items
              {viewingInvoice.status === 'DRAFT' || viewingInvoice.status === 'PROCESSING' ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => addItemMutation.mutate({ id: viewingInvoice.id, item: { description: '', quantity: 1, unitPrice: 0, taxRate: 0, discountRate: 0 } })}
                  disabled={addItemMutation.isPending}
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  Add Item
                </Button>
              ) : null}
            </h4>
            <DataTable
              data={viewingInvoice.items}
              columns={[
                { key: 'id', header: 'Item', width: '80px', render: (row) => <span className="font-mono text-xs">{row.id.slice(0, 8)}...</span> },
                { key: 'productId', header: 'Product', width: '100px', render: (row) => row.productId ? <span className="font-mono text-xs">{row.productId.slice(0, 8)}...</span> : '—' },
                { key: 'quantity', header: 'Qty', align: 'center', width: '60px' },
                { key: 'unitPrice', header: 'Unit Price', align: 'right', width: '100px', render: (row) => formatCurrency(row.unitPrice) },
                { key: 'taxRate', header: 'Tax %', align: 'center', width: '70px', render: (row) => `${row.taxRate}%` },
                { key: 'discountRate', header: 'Disc %', align: 'center', width: '70px', render: (row) => `${row.discountRate}%` },
                { key: 'lineTotal', header: 'Line Total', align: 'right', width: '110px', render: (row) => formatCurrency(row.lineTotal) },
              ]}
              keyExtractor={(row) => row.id}
              searchable={false}
              sortable={false}
              pagination={{ enabled: false }}
              emptyMessage="No items"
            />

            <div className="flex justify-end gap-3 pt-4 border-t border-secondary-200">
              <Button type="button" variant="secondary" onClick={closeModal}>Close</Button>
            </div>
          </div>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); toast.error('Invoice creation requires supplier selection. Upload a document for OCR processing.'); }} className="space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="text-center py-8 text-secondary-500">
              <FileText className="w-12 h-12 mx-auto mb-4 text-secondary-300" />
              <p>Invoice creation requires supplier selection and line items.</p>
              <p className="text-sm mt-2">Upload a PDF/image for OCR processing to create an invoice automatically.</p>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-secondary-200">
              <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
            </div>
          </form>
        )}
      </Modal>

      <Modal
        isOpen={showOcrReview}
        onClose={closeOcrReview}
        title="Review & Verify Invoice"
        size="xl"
      >
        {ocrResult ? (
          <div className="space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-primary-600" />
                  <h4 className="font-medium text-primary-800">Review OCR Results</h4>
                </div>
                <div className="flex items-center gap-2 text-sm text-primary-700">
                  <span className="font-medium">Confidence:</span>
                  <span>{ocrResult.confidence ? `${(ocrResult.confidence * 100).toFixed(1)}%` : 'N/A'}</span>
                  {ocrResult.rawText && (
                    <React.Fragment>
                      <span className="mx-2">|</span>
                      <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard.writeText(ocrResult.rawText!); toast.success('Raw text copied to clipboard'); }} leftIcon={<FileQuestion className="w-3 h-3" />}>
                        Copy Raw Text
                      </Button>
                    </React.Fragment>
                  )}
                </div>
              </div>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); if (reviewData && viewingInvoice) { if (viewingInvoice.ocrStatus === 'COMPLETED') { handleVerifyOcr(viewingInvoice.id); } else { verifyMutation.mutate(viewingInvoice.id); } } }} className="space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Invoice Number *"
                  name="invoiceNumber"
                  value={reviewData?.invoiceNumber || ''}
                  onChange={(e) => handleReviewDataChange('invoiceNumber', e.target.value)}
                  error={!reviewData?.invoiceNumber ? 'Invoice number is required' : undefined}
                  placeholder="INV-2024-001"
                  disabled={reviewLoading}
                />
                <Input
                  label="Invoice Date *"
                  name="invoiceDate"
                  type="date"
                  value={reviewData?.invoiceDate || ''}
                  onChange={(e) => handleReviewDataChange('invoiceDate', e.target.value)}
                  error={!reviewData?.invoiceDate ? 'Invoice date is required' : undefined}
                  disabled={reviewLoading}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Due Date *"
                  name="dueDate"
                  type="date"
                  value={reviewData?.dueDate || ''}
                  onChange={(e) => handleReviewDataChange('dueDate', e.target.value)}
                  error={!reviewData?.dueDate ? 'Due date is required' : undefined}
                  disabled={reviewLoading}
                />
                <Select
                  label="Supplier *"
                  name="supplierId"
                  value={reviewData?.supplierId || ''}
                  onChange={(e) => handleReviewDataChange('supplierId', e.target.value)}
                  options={[]}
                  placeholder="Select supplier"
                  disabled={reviewLoading}
                />
              </div>
              <Input
                label="Notes"
                name="notes"
                value={reviewData?.notes || ''}
                onChange={(e) => handleReviewDataChange('notes', e.target.value)}
                placeholder="Additional notes"
                disabled={reviewLoading}
                className="md:col-span-2"
              />

              <h4 className="font-medium text-secondary-900 pt-4 border-t border-secondary-200">Invoice Items</h4>
              <div className="space-y-3">
                {reviewData?.items?.map((item, index) => (
                  <div key={index} className="grid grid-cols-6 gap-3 p-3 bg-secondary-50 rounded-lg">
                    <Input
                      label="Description"
                      name={`items[${index}].description`}
                      value={item.description || ''}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      placeholder="Item description"
                      disabled={reviewLoading}
                      className="col-span-2"
                    />
                    <Input
                      label="Qty"
                      name={`items[${index}].quantity`}
                      type="number"
                      min="1"
                      value={item.quantity || 1}
                      onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                      disabled={reviewLoading}
                      className="w-20"
                    />
                    <Input
                      label="Unit Price"
                      name={`items[${index}].unitPrice`}
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.unitPrice || 0}
                      onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                      disabled={reviewLoading}
                    />
                    <Input
                      label="Tax %"
                      name={`items[${index}].taxRate`}
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={item.taxRate || 0}
                      onChange={(e) => handleItemChange(index, 'taxRate', parseFloat(e.target.value) || 0)}
                      disabled={reviewLoading}
                    />
                    <Input
                      label="Disc %"
                      name={`items[${index}].discountRate`}
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={item.discountRate || 0}
                      onChange={(e) => handleItemChange(index, 'discountRate', parseFloat(e.target.value) || 0)}
                      disabled={reviewLoading}
                    />
                    <div className="flex items-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(index)}
                        disabled={reviewLoading}
                        className="text-red-600 hover:bg-red-50"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={addItem}
                  disabled={reviewLoading}
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  Add Item
                </Button>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-secondary-200">
                <Button type="button" variant="secondary" onClick={closeOcrReview} disabled={reviewLoading}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  loading={reviewLoading}
                  disabled={reviewLoading}
                >
                  Save & Verify
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