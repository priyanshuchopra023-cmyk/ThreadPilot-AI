import React, { useState } from 'react';
import { 
  Search, 
  AlertTriangle, 
  Bell, 
  Check, 
  X, 
  Clock, 
  Eye, 
  AlertCircle, 
  ShieldAlert, 
  CheckCircle2, 
  ArrowRight 
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
import { alertApi } from '../api/endpoints';
import type { Alert, PaginatedResponse } from '../types';
import toast from 'react-hot-toast';

const statusOptions = [
  { value: 'UNREAD', label: 'Unread' },
  { value: 'READ', label: 'Read' },
  { value: 'DISMISSED', label: 'Dismissed' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'SNOOZED', label: 'Snoozed' },
];

const severityOptions = [
  { value: 'INFO', label: 'Info' },
  { value: 'WARNING', label: 'Warning' },
  { value: 'CRITICAL', label: 'Critical' },
  { value: 'URGENT', label: 'Urgent' },
];

export const Alerts: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showModal, setShowModal] = useState(false);
  const [viewingAlert, setViewingAlert] = useState<Alert | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const { data, isLoading, error } = useQuery<Alert[]>({
    queryKey: ['alerts', page, pageSize, search, statusFilter, severityFilter],
    queryFn: async () => {
      const res = await alertApi.list({ page, size: pageSize, status: statusFilter, severity: severityFilter });
      const pageData = res.data as PaginatedResponse<Alert> | undefined;
      return pageData?.content || [];
    },
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => alertApi.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      refetchUnreadCount();
      toast.success('Alert marked as read');
    },
    onError: () => toast.error('Failed to mark as read'),
  });

  const markResolvedMutation = useMutation({
    mutationFn: (id: string) => alertApi.markResolved(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      refetchUnreadCount();
      toast.success('Alert marked as resolved');
    },
    onError: () => toast.error('Failed to mark as resolved'),
  });

  const dismissMutation = useMutation({
    mutationFn: (id: string) => alertApi.dismiss(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      refetchUnreadCount();
      toast.success('Alert dismissed');
    },
    onError: () => toast.error('Failed to dismiss alert'),
  });

  const refetchUnreadCount = async () => {
    try {
      const res = await alertApi.getUnreadCount();
      if (res.data) setUnreadCount(res.data.count || 0);
    } catch {
      // ignore
    }
  };

  const handleMarkRead = (id: string) => markReadMutation.mutate(id);
  const handleMarkResolved = (id: string) => markResolvedMutation.mutate(id);
  const handleDismiss = (id: string) => dismissMutation.mutate(id);

  const closeModal = () => {
    setShowModal(false);
    setViewingAlert(null);
  };

  React.useEffect(() => {
    refetchUnreadCount();
  }, []);

  if (isLoading && !data) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-navy-100 rounded w-48" />
        <Card><CardBody className="p-6 h-64"><div className="h-4 bg-navy-100 rounded w-1/4 mb-4"/><div className="space-y-3"><div className="h-10 bg-navy-100 rounded"/><div className="h-10 bg-navy-100 rounded"/></div></CardBody></Card>
      </div>
    );
  }

  const alerts = data || [];
  const totalItems = data?.length || 0;
  const criticalCount = alerts.filter(a => a.severity === 'CRITICAL' || a.severity === 'URGENT').length;
  const resolvedCount = alerts.filter(a => a.status === 'RESOLVED').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Alerts"
        description="Automated business monitoring, stock depletion threshold warnings, and system exceptions"
        breadcrumbs={[
          { label: 'Operations' },
          { label: 'Alerts' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Badge variant="danger" size="md" dot>
                {unreadCount} Unread
              </Badge>
            )}
            <Button 
              variant="secondary" 
              size="sm"
              onClick={refetchUnreadCount} 
              leftIcon={<Clock className="w-3.5 h-3.5" />}
            >
              Sync
            </Button>
          </div>
        }
      />

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white border border-navy-100 rounded-xl shadow-card flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-navy-50 text-navy-700 flex items-center justify-center flex-shrink-0">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-navy-500">Active Notifications</p>
            <p className="text-xl font-bold text-navy-900 font-mono tabular-nums">{alerts.length}</p>
          </div>
        </div>

        <div className="p-4 bg-white border border-navy-100 rounded-xl shadow-card flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-danger-50 text-danger-700 flex items-center justify-center flex-shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-navy-500">Critical / Urgent</p>
            <p className="text-xl font-bold text-danger-700 font-mono tabular-nums">{criticalCount}</p>
          </div>
        </div>

        <div className="p-4 bg-white border border-navy-100 rounded-xl shadow-card flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-success-50 text-success-700 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-navy-500">Resolved Incidents</p>
            <p className="text-xl font-bold text-success-800 font-mono tabular-nums">{resolvedCount}</p>
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
                placeholder="Search alert topics or messages..."
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
                value={severityFilter}
                onChange={(e) => { setSeverityFilter(e.target.value); setPage(1); }}
                options={[{ value: '', label: 'All Severities' }, ...severityOptions]}
                placeholder="Filter by severity"
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
            <div className="p-8 text-center text-danger-600 font-medium text-sm">Failed to load alerts</div>
          ) : (
            <DataTable<Alert>
              data={alerts}
              columns={[
                { 
                  key: 'alertType', 
                  header: 'Type', 
                  width: '150px', 
                  render: (row: Alert) => (
                    <Badge 
                      variant={
                        row.severity === 'CRITICAL' || row.severity === 'URGENT' ? 'danger' :
                        row.severity === 'WARNING' ? 'warning' : 'secondary'
                      }
                      size="sm"
                    >
                      {row.alertType.replace(/_/g, ' ')}
                    </Badge>
                  )
                },
                { 
                  key: 'severity', 
                  header: 'Severity', 
                  width: '100px', 
                  render: (row: Alert) => (
                    <Badge 
                      variant={
                        row.severity === 'CRITICAL' || row.severity === 'URGENT' ? 'danger' :
                        row.severity === 'WARNING' ? 'warning' : 'info'
                      }
                      dot
                      size="sm"
                    >
                      {row.severity}
                    </Badge>
                  )
                },
                { 
                  key: 'status', 
                  header: 'Status', 
                  width: '110px', 
                  render: (row: Alert) => (
                    <span className="text-xs font-medium text-navy-700">
                      {row.status}
                    </span>
                  )
                },
                { 
                  key: 'title', 
                  header: 'Title & Summary',
                  render: (row: Alert) => (
                    <div>
                      <div className="font-semibold text-xs text-navy-900">{row.title}</div>
                      <div className="text-[11px] text-navy-500 truncate max-w-sm mt-0.5">{row.message}</div>
                    </div>
                  )
                },
                { 
                  key: 'createdAt', 
                  header: 'Timestamp', 
                  width: '140px', 
                  render: (row: Alert) => (
                    <span className="text-xs text-navy-500 font-mono">
                      {new Date(row.createdAt).toLocaleDateString()}
                    </span>
                  ) 
                },
                { 
                  key: 'actions', 
                  header: '', 
                  width: '160px', 
                  align: 'center',
                  render: (row: Alert) => (
                    <div className="flex items-center justify-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => { setViewingAlert(row); setShowModal(true); }} 
                        aria-label="View alert"
                        className="text-navy-600 hover:text-navy-900 p-1.5 h-7 w-7"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                      {row.status === 'UNREAD' && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleMarkRead(row.id)} 
                          aria-label="Mark as read"
                          className="text-navy-700 hover:bg-navy-50 text-[11px] px-1.5 py-0.5 h-7 font-medium"
                        >
                          Read
                        </Button>
                      )}
                      {row.status !== 'RESOLVED' && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleMarkResolved(row.id)} 
                          aria-label="Mark as resolved"
                          className="text-success-700 hover:bg-success-50 text-[11px] px-1.5 py-0.5 h-7 font-medium"
                        >
                          Resolve
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDismiss(row.id)} 
                        aria-label="Dismiss"
                        className="text-navy-400 hover:text-navy-600 hover:bg-navy-50 text-[11px] px-1.5 py-0.5 h-7"
                      >
                        Dismiss
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
              emptyMessage="No operational alerts pending"
            />
          )}
        </CardBody>
      </Card>

      {/* Detail Modal */}
      <Modal
        isOpen={showModal && !!viewingAlert}
        onClose={closeModal}
        title={viewingAlert?.title || 'Alert Details'}
        size="lg"
      >
        {viewingAlert && (
          <div className="space-y-4 max-h-[72vh] overflow-y-auto px-1 py-1">
            <div className="grid grid-cols-3 gap-3 p-3.5 bg-navy-50/70 border border-navy-100 rounded-xl">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-navy-500">Category</p>
                <p className="text-xs font-bold text-navy-900 mt-0.5">{viewingAlert.alertType.replace(/_/g, ' ')}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-navy-500">Severity</p>
                <Badge variant={viewingAlert.severity === 'CRITICAL' || viewingAlert.severity === 'URGENT' ? 'danger' : 'warning'} size="sm" dot className="mt-0.5">
                  {viewingAlert.severity}
                </Badge>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-navy-500">Status</p>
                <p className="text-xs font-semibold text-navy-800 mt-0.5">{viewingAlert.status}</p>
              </div>
            </div>

            <div className="p-3.5 bg-white border border-navy-100 rounded-xl">
              <p className="text-xs font-semibold uppercase tracking-wider text-navy-500 mb-1">Message Description</p>
              <p className="text-xs text-navy-800 leading-relaxed">{viewingAlert.message}</p>
            </div>

            {viewingAlert.supportingData && (
              <div className="p-3.5 bg-navy-50/50 border border-navy-100 rounded-xl">
                <p className="text-xs font-semibold uppercase tracking-wider text-navy-500 mb-1.5">Context Telemetry</p>
                <pre className="p-3 bg-white border border-navy-100 rounded-lg text-xs font-mono text-navy-700 overflow-x-auto">
                  {viewingAlert.supportingData}
                </pre>
              </div>
            )}

            <div className="flex justify-end gap-2.5 pt-4 border-t border-navy-100">
              <Button type="button" variant="secondary" onClick={closeModal}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Alerts;
