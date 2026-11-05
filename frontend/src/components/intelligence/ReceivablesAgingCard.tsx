import React from 'react';
import { 
  Clock, 
  AlertTriangle, 
  ArrowRight, 
  DollarSign, 
  ShieldCheck, 
  Users,
  Calendar
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardBody } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { analyticsApi } from '../../api/endpoints';
import type { ReceivablesAging } from '../../types';

export const ReceivablesAgingCard: React.FC = () => {
  const { data: aging, isLoading, error, refetch } = useQuery<ReceivablesAging>({
    queryKey: ['receivables-aging'],
    queryFn: async () => {
      const res = await analyticsApi.getReceivablesAging();
      const raw = res.data as any;
      return (raw && raw.current0To30 !== undefined ? raw : raw?.data || raw) as ReceivablesAging;
    },
  });

  if (isLoading) {
    return (
      <Card className="h-full flex flex-col border-navy-100 shadow-sm animate-pulse">
        <CardHeader title="Receivables Aging (Due Dates)" description="Loading live ledger telemetry..." />
        <CardBody className="p-5 space-y-4">
          <div className="grid grid-cols-4 gap-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 bg-navy-50 rounded-xl" />
            ))}
          </div>
          <div className="h-28 bg-navy-50 rounded-xl" />
        </CardBody>
      </Card>
    );
  }

  if (error || !aging) {
    return (
      <Card className="h-full flex flex-col border-navy-100 shadow-sm">
        <CardHeader title="Receivables Aging (Due Dates)" description="Customer debt exposure by invoice terms" />
        <CardBody className="p-8 text-center">
          <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
          <p className="text-xs font-semibold text-navy-900">Could not calculate receivables aging</p>
          <Button variant="ghost" size="sm" onClick={() => refetch()} className="mt-2 text-xs">
            Retry
          </Button>
        </CardBody>
      </Card>
    );
  }

  const total = aging.totalReceivables || 0;
  const c0_30 = aging.current0To30 || 0;
  const o31_60 = aging.overdue31To60 || 0;
  const o61_90 = aging.overdue61To90 || 0;
  const o90Plus = aging.overdue90Plus || 0;
  const totalOverdue = o31_60 + o61_90 + o90Plus;
  const overduePercent = total > 0 ? (totalOverdue / total) * 100 : 0;

  const buckets = [
    { label: 'Current (0–30d)', amount: c0_30, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-100' },
    { label: '31–60d Overdue', amount: o31_60, color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-100' },
    { label: '61–90d Overdue', amount: o61_90, color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-100' },
    { label: '90+ Days Late', amount: o90Plus, color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-100' },
  ];

  return (
    <Card className="h-full flex flex-col border-navy-100 shadow-sm">
      <CardHeader
        title={
          <div className="flex items-center gap-2">
            <span className="font-bold text-navy-950 text-base">Receivables Aging</span>
            <Badge variant="brass" size="sm" className="font-mono text-[9px] uppercase tracking-wider">
              Due-Date Grounded
            </Badge>
          </div>
        }
        description="Aged according to customer credit terms (e.g. NET 30, NET 60), not premature order dates"
        action={
          <Button variant="ghost" size="sm" asChild className="text-xs font-semibold text-navy-700 hover:text-navy-950">
            <a href="/customers" className="flex items-center gap-1">
              Customers <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </Button>
        }
      />

      <CardBody className="p-5 flex-1 flex flex-col justify-between space-y-4">
        {/* Total Ledger Header */}
        <div className="flex items-baseline justify-between pb-3 border-b border-navy-100/70">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-navy-500">Total Outstanding</span>
            <p className="text-2xl font-bold font-mono text-navy-950 tabular-nums">
              ₹{Number(total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-navy-500">Delinquency Ratio</span>
            <p className={`text-sm font-bold font-mono tabular-nums ${overduePercent > 25 ? 'text-rose-600' : 'text-navy-700'}`}>
              {overduePercent.toFixed(1)}% past due
            </p>
          </div>
        </div>

        {/* 4 Pillars Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {buckets.map((b) => (
            <div key={b.label} className={`p-3 rounded-xl border ${b.bg} ${b.border} flex flex-col justify-between`}>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-navy-600">{b.label}</span>
              <p className={`text-sm sm:text-base font-bold font-mono tabular-nums mt-1 ${b.color}`}>
                ₹{Number(b.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
            </div>
          ))}
        </div>

        {/* Customer Accounts Breakdown */}
        {aging.customerSummaries && aging.customerSummaries.length > 0 ? (
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between text-xs font-semibold text-navy-600 px-1">
              <span>Customer Account</span>
              <div className="flex items-center gap-6">
                <span>Overdue (Days)</span>
                <span>Outstanding</span>
              </div>
            </div>
            <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
              {aging.customerSummaries.slice(0, 5).map((c) => (
                <div
                  key={c.customerId}
                  className="p-2.5 rounded-lg bg-navy-50/60 hover:bg-navy-50 border border-navy-100 flex items-center justify-between transition-colors"
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <a href={`/customers`} className="text-xs font-semibold text-navy-900 hover:text-blue-700 truncate block">
                      {c.customerName}
                    </a>
                    {c.earliestDueDate && (
                      <span className="text-[10px] text-navy-500 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3 text-navy-400" />
                        Due since: {c.earliestDueDate}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-6 flex-shrink-0">
                    <Badge variant={c.daysOverdue > 60 ? 'danger' : c.daysOverdue > 30 ? 'warning' : 'secondary'} size="sm">
                      {c.daysOverdue > 0 ? `${c.daysOverdue}d late` : 'Within terms'}
                    </Badge>
                    <span className="font-mono text-xs font-bold text-navy-950 tabular-nums">
                      ₹{Number(c.outstanding).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-6 text-center text-xs text-navy-400">
            No active customers with outstanding ledger balances.
          </div>
        )}
      </CardBody>
    </Card>
  );
};
