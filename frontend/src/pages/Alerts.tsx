import React, { useState } from 'react';
import { Search, Filter, AlertTriangle, Bell, Check, X, ChevronDown, Clock, Eye } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { DataTable } from '../components/tables/DataTable';
import { Badge } from '../components/ui/Badge';
import { alertApi } from '../api/endpoints';
import type { Alert } from '../types';
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

  const { data, isLoading, error, refetch } = useQuery<Alert[]>({
    queryKey: ['alerts', page, pageSize, search, statusFilter, severityFilter],
    queryFn: async () => {
      const res = await alertApi.list({ page, size: pageSize, status: statusFilter, severity: severityFilter });
      return (res.data as unknown) as Alert[];
    },
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => alertApi.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      refetchUnreadCount();
    },
    onError: () => toast.error('Failed to mark as read'),
  });

  const markResolvedMutation = useMutation({
    mutationFn: (id: string) => alertApi.markResolved(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      refetchUnreadCount();
    },
    onError: () => toast.error('Failed to mark as resolved'),
  });

  const dismissMutation = useMutation({
    mutationFn: (id: string) => alertApi.dismiss(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      refetchUnreadCount();
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
        <div className="flex items-center justify-between">
          <div className="h-8 bg-secondary-200 rounded w-48" />
          <div className="h-10 bg-secondary-200 rounded w-32" />
        </div>
        <Card><CardBody className="p-6 h-64"><div className="h-4 bg-secondary-200 rounded w-1/4 mb-4"/><div className="space-y-3"><div className="h-10 bg-secondary-200 rounded"/><div className="h-10 bg-secondary-200 rounded"/></div></CardBody></Card>
      </div>
    );
  }

  const alerts = data || [];
  const totalItems = data?.length || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-primary-600" />
            Alerts
            {unreadCount > 0 && (
              <Badge variant="danger" className="ml-2">{unreadCount}</Badge>
            )}
          </h1>
          <p className="text-secondary-600 mt-1">Monitor business alerts and notifications</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={refetchUnreadCount} leftIcon={<Clock className="w-4 h-4" />} loading={false}>
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardBody className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400 w-5 h-5" />
              <Input
                placeholder="Search alerts..."
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
              value={severityFilter}
              onChange={(e) => { setSeverityFilter(e.target.value); setPage(1); }}
              options={[{ value: '', label: 'All Severities' }, ...severityOptions]}
              placeholder="Filter by severity"
              className="w-full sm:w-40"
            />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="p-0">
          {error ? (
            <div className="p-6 text-center text-red-600">Failed to load alerts</div>
          ) : (
            <DataTable<Alert>
              data={alerts}
              columns={[
                { key: 'alertType', header: 'Type', width: '160px', render: (row: Alert) => (
                  <Badge variant={
                    row.severity === 'CRITICAL' || row.severity === 'URGENT' ? 'danger' :
                    row.severity === 'WARNING' ? 'warning' : 'info'
                  }>
                    {row.alertType.replace(/_/g, ' ')}
                  </Badge>
                )},
                { key: 'severity', header: 'Severity', width: '100px', render: (row) => (
                  <Badge variant={
                    row.severity === 'CRITICAL' || row.severity === 'URGENT' ? 'danger' :
                    row.severity === 'WARNING' ? 'warning' : 'info'
                  }>
                    {row.severity}
                  </Badge>
                )},
                { key: 'status', header: 'Status', width: '120px', render: (row) => (
                  <Badge variant={
                    row.status === 'UNREAD' ? 'info' :
                    row.status === 'READ' ? 'secondary' :
                    row.status === 'RESOLVED' ? 'success' :
                    row.status === 'DISMISSED' ? 'secondary' : 'warning'
                  }>
                    {row.status}
                  </Badge>
                )},
                { key: 'title', header: 'Title' },
                { key: 'message', header: 'Message', render: (row) => <span className="max-w-xs truncate block">{row.message}</span> },
                { key: 'entityType', header: 'Entity', width: '120px', render: (row) => row.entityType ? `${row.entityType}: ${row.entityId?.slice(0, 8)}...` : '—' },
                { key: 'createdAt', header: 'Created', width: '160px', render: (row) => new Date(row.createdAt).toLocaleString() },
                { key: 'actions', header: 'Actions', width: '180px', render: (row) => (
                  <div className="flex items-center justify-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => { setViewingAlert(row); setShowModal(true); }} aria-label="View alert">
                      <Eye className="w-4 h-4" />
                    </Button>
                    {row.status === 'UNREAD' && (
                      <Button variant="ghost" size="sm" onClick={() => handleMarkRead(row.id)} leftIcon={<Check className="w-3 h-3" />} className="text-green-600 hover:bg-green-50" aria-label="Mark as read">
                        Read
                      </Button>
                    )}
                    {row.status !== 'RESOLVED' && (
                      <Button variant="ghost" size="sm" onClick={() => handleMarkResolved(row.id)} leftIcon={<Check className="w-3 h-3" />} className="text-blue-600 hover:bg-blue-50" aria-label="Mark as resolved">
                        Resolve
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => handleDismiss(row.id)} leftIcon={<X className="w-3 h-3" />} className="text-secondary-600 hover:bg-secondary-50" aria-label="Dismiss">
                      Dismiss
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
              emptyMessage="No alerts"
            />
          )}
        </CardBody>
      </Card>

      <Modal
        isOpen={showModal && !!viewingAlert}
        onClose={closeModal}
        title={viewingAlert?.title || 'Alert Details'}
        size="lg"
      >
        {viewingAlert && (
          <div className="space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Type</label>
                <Badge variant={
                  viewingAlert.severity === 'CRITICAL' || viewingAlert.severity === 'URGENT' ? 'danger' :
                  viewingAlert.severity === 'WARNING' ? 'warning' : 'info'
                }>
                  {viewingAlert.alertType.replace(/_/g, ' ')}
                </Badge>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Severity</label>
                <Badge variant={
                  viewingAlert.severity === 'CRITICAL' || viewingAlert.severity === 'URGENT' ? 'danger' :
                  viewingAlert.severity === 'WARNING' ? 'warning' : 'info'
                }>
                  {viewingAlert.severity}
                </Badge>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Status</label>
                <Badge variant={
                  viewingAlert.status === 'UNREAD' ? 'info' :
                  viewingAlert.status === 'READ' ? 'secondary' :
                  viewingAlert.status === 'RESOLVED' ? 'success' :
                  viewingAlert.status === 'DISMISSED' ? 'secondary' : 'warning'
                }>
                  {viewingAlert.status}
                </Badge>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">Message</label>
              <p className="text-secondary-600">{viewingAlert.message}</p>
            </div>

            {viewingAlert.supportingData && (
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Supporting Data</label>
                <pre className="bg-secondary-100 p-4 rounded-lg text-sm text-secondary-600 overflow-x-auto">
                  {viewingAlert.supportingData}
                </pre>
              </div>
            )}

            {viewingAlert.actionUrl && viewingAlert.actionLabel && (
              <div>
                <a href={viewingAlert.actionUrl} className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium">
                  {viewingAlert.actionLabel}
                  <ChevronDown className="w-4 h-4" />
                </a>
              </div>
            )}

            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-secondary-200">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Created</label>
                <p className="text-secondary-900">{new Date(viewingAlert.createdAt).toLocaleString()}</p>
              </div>
              {viewingAlert.readAt && (
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Read At</label>
                  <p className="text-secondary-900">{new Date(viewingAlert.readAt).toLocaleString()}</p>
                </div>
              )}
              {viewingAlert.resolvedAt && (
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Resolved At</label>
                  <p className="text-secondary-900">{new Date(viewingAlert.resolvedAt).toLocaleString()}</p>
                </div>
              )}
              {viewingAlert.dismissedAt && (
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Dismissed At</label>
                  <p className="text-secondary-900">{new Date(viewingAlert.dismissedAt).toLocaleString()}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-secondary-200">
              <Button type="button" variant="secondary" onClick={closeModal}>Close</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};