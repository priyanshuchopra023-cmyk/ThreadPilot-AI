import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ExternalLink, 
  Copy, 
  MessageSquare, 
  ShieldAlert, 
  Package, 
  CreditCard, 
  Users, 
  TrendingUp,
  Filter,
  Check
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardBody } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { analyticsApi } from '../../api/endpoints';
import type { ActionItem } from '../../types';
import toast from 'react-hot-toast';

export const DailyActionCenterCard: React.FC = () => {
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [itemStatuses, setItemStatuses] = useState<Record<string, 'PENDING' | 'IN_REVIEW' | 'COMPLETED'>>({});
  const [reviewModalItem, setReviewModalItem] = useState<ActionItem | null>(null);

  const { data: actions, isLoading, error, refetch } = useQuery<ActionItem[]>({
    queryKey: ['daily-action-center'],
    queryFn: async () => {
      const res = await analyticsApi.getActionCenter();
      return (res.data || []) as ActionItem[];
    },
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'COLLECTION':
        return <ShieldAlert className="w-4 h-4 text-rose-600" />;
      case 'INVENTORY':
        return <Package className="w-4 h-4 text-amber-600" />;
      case 'PAYABLE':
        return <CreditCard className="w-4 h-4 text-blue-600" />;
      case 'SALES':
        return <TrendingUp className="w-4 h-4 text-emerald-600" />;
      default:
        return <Users className="w-4 h-4 text-navy-600" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return <Badge variant="danger" size="sm" dot>High Priority</Badge>;
      case 'MEDIUM':
        return <Badge variant="warning" size="sm" dot>Medium</Badge>;
      default:
        return <Badge variant="secondary" size="sm">Routine</Badge>;
    }
  };

  const updateStatus = (id: string, status: 'PENDING' | 'IN_REVIEW' | 'COMPLETED') => {
    setItemStatuses((prev) => ({ ...prev, [id]: status }));
    toast.success(`Action marked as ${status.replace('_', ' ').toLowerCase()}`);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Draft message copied to clipboard');
  };

  const items = actions || [];
  const filteredItems = items.filter((item) => {
    if (filterCategory === 'ALL') return true;
    return item.category === filterCategory;
  });

  return (
    <Card className="h-full flex flex-col border-navy-100 shadow-sm">
      <CardHeader
        title={
          <div className="flex items-center gap-2">
            <span className="font-bold text-navy-950 text-base">Daily Action Centre</span>
            <Badge variant="brass" size="sm" className="font-mono text-[9px] uppercase tracking-wider">
              Prioritized by AI Brain
            </Badge>
          </div>
        }
        description="Grounded operational recommendations requiring supervisor review"
        action={
          <div className="flex items-center gap-1.5 flex-wrap">
            {['ALL', 'COLLECTION', 'INVENTORY', 'PAYABLE', 'SALES'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setFilterCategory(cat)}
                className={`px-2 py-0.5 text-[10px] font-semibold rounded-md transition-colors ${
                  filterCategory === cat
                    ? 'bg-navy-900 text-white shadow-xs'
                    : 'bg-navy-50 text-navy-600 hover:bg-navy-100'
                }`}
              >
                {cat === 'ALL' ? 'All' : cat.charAt(0) + cat.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        }
      />

      <CardBody className="p-0 flex-1 flex flex-col justify-between">
        {isLoading ? (
          <div className="p-6 space-y-3 animate-pulse">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-navy-50 rounded-xl" />
            ))}
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
            <p className="text-xs font-semibold text-navy-900">Failed to load recommended actions</p>
            <Button variant="ghost" size="sm" onClick={() => refetch()} className="mt-2 text-xs">
              Retry
            </Button>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-10 text-center flex flex-col items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-2">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-navy-900">All Operations Clear</p>
            <p className="text-[11px] text-navy-500 max-w-xs mt-0.5">
              No urgent overdue collection breaches or stockout tasks pending today.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-navy-100/70 overflow-y-auto max-h-[380px]">
            {filteredItems.map((item, idx) => {
              const itemId = item.entityId || `action-${idx}`;
              const currentStatus = itemStatuses[itemId] || 'PENDING';

              return (
                <div
                  key={itemId}
                  className={`p-4 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    currentStatus === 'COMPLETED' ? 'bg-stone-50/60 opacity-60' : 'hover:bg-navy-50/40'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <div className="p-1 rounded-md bg-white border border-navy-100 shadow-xs">
                        {getCategoryIcon(item.category)}
                      </div>
                      <span className="font-semibold text-xs text-navy-900">{item.title}</span>
                      {getPriorityBadge(item.priority)}
                      {item.financialImpact !== undefined && item.financialImpact !== null && (
                        <span className="font-mono text-[11px] font-bold text-navy-800 bg-brass-50 border border-brass-200/80 px-1.5 py-0.2 rounded">
                          ₹{Number(item.financialImpact).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-navy-600 leading-relaxed font-normal">{item.reason}</p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                    {item.suggestedDraftMessage && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setReviewModalItem(item)}
                        className="text-[11px] h-7 px-2.5 font-medium flex items-center gap-1 text-brass-800 border-brass-200 bg-brass-50/50 hover:bg-brass-100/60"
                      >
                        <MessageSquare className="w-3 h-3 text-brass-700" />
                        Review Draft
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="text-[11px] h-7 px-2 text-navy-700 hover:text-navy-950"
                    >
                      <a href={item.actionUrl} className="flex items-center gap-1">
                        View Record <ExternalLink className="w-3 h-3" />
                      </a>
                    </Button>

                    <div className="flex items-center bg-navy-50 rounded-lg p-0.5 border border-navy-100">
                      <button
                        type="button"
                        onClick={() => updateStatus(itemId, currentStatus === 'COMPLETED' ? 'PENDING' : 'COMPLETED')}
                        title={currentStatus === 'COMPLETED' ? 'Mark Pending' : 'Mark Completed'}
                        className={`p-1 rounded transition-colors ${
                          currentStatus === 'COMPLETED'
                            ? 'bg-emerald-600 text-white'
                            : 'text-navy-500 hover:text-navy-900'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="p-3 bg-navy-50/50 border-t border-navy-100 flex items-center justify-between text-[11px] text-navy-500">
          <span>AI actions are advisory. No external charges or messages are dispatched automatically.</span>
          <a href="/thread-ai" className="font-semibold text-navy-800 hover:underline flex items-center gap-1">
            Ask Thread AI →
          </a>
        </div>
      </CardBody>

      {/* Review & Approve Draft Follow-up Modal */}
      {reviewModalItem && (
        <Modal
          isOpen={!!reviewModalItem}
          onClose={() => setReviewModalItem(null)}
          title={`Review Follow-up: ${reviewModalItem.title}`}
          size="md"
        >
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-navy-50 border border-navy-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-navy-500 block">Context & Trigger</span>
              <p className="text-xs text-navy-800 mt-0.5">{reviewModalItem.reason}</p>
              {reviewModalItem.financialImpact && (
                <p className="text-xs font-mono font-bold text-navy-950 mt-1">
                  Financial Exposure: ₹{Number(reviewModalItem.financialImpact).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-navy-900">Suggested Draft Message (WhatsApp / Email)</span>
                <span className="text-[10px] text-navy-500">Edit or copy before dispatch</span>
              </div>
              <textarea
                readOnly
                value={reviewModalItem.suggestedDraftMessage}
                rows={4}
                className="w-full text-xs font-sans p-3 bg-stone-50 border border-navy-200 rounded-lg text-navy-900 focus:outline-none focus:ring-1 focus:ring-navy-800"
              />
            </div>

            <div className="p-3 rounded-lg bg-amber-50/70 border border-amber-200 text-amber-900 text-[11px] flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Human Approval Gate:</span> Thread AI never sends messages automatically. 
                Please copy the text and send it through your verified WhatsApp Business or Email account.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-navy-100">
              <Button variant="secondary" size="sm" onClick={() => setReviewModalItem(null)}>
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  if (reviewModalItem.suggestedDraftMessage) {
                    copyToClipboard(reviewModalItem.suggestedDraftMessage);
                    updateStatus(reviewModalItem.entityId || 'review-item', 'IN_REVIEW');
                  }
                  setReviewModalItem(null);
                }}
                leftIcon={<Copy className="w-3.5 h-3.5" />}
              >
                Copy & Mark In Review
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </Card>
  );
};
