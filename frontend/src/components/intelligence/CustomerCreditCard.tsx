import React, { useState } from 'react';
import { 
  Users, 
  ShieldAlert, 
  Sparkles, 
  ArrowRight, 
  Clock, 
  AlertTriangle, 
  MessageSquare,
  TrendingUp,
  UserCheck
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardBody } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { analyticsApi } from '../../api/endpoints';
import type { CustomerIntelligence } from '../../types';

export const CustomerCreditCard: React.FC = () => {
  const [selectedSegment, setSelectedSegment] = useState<string>('ALL');

  const { data: intelligence, isLoading, error, refetch } = useQuery<CustomerIntelligence[]>({
    queryKey: ['customer-credit-intelligence'],
    queryFn: async () => {
      const res = await analyticsApi.getCustomerCreditIntelligence();
      return (res.data || []) as CustomerIntelligence[];
    },
  });

  const getSegmentBadge = (segment: string) => {
    switch (segment) {
      case 'CREDIT_LIMIT_BREACHED':
        return <Badge variant="danger" size="sm" dot>Limit Breached</Badge>;
      case 'HIGH_SALES_POOR_COLLECTION':
        return <Badge variant="warning" size="sm" dot>High Sales / Slow Pay</Badge>;
      case 'REACTIVATION_OPPORTUNITY':
        return <Badge variant="brass" size="sm" dot>Reactivation Target</Badge>;
      case 'CHAMPION':
        return <Badge variant="success" size="sm">Champion</Badge>;
      case 'NEW_ACCOUNT':
        return <Badge variant="secondary" size="sm">New Account</Badge>;
      default:
        return <Badge variant="secondary" size="sm">Regular</Badge>;
    }
  };

  const customers = intelligence || [];
  const filteredCustomers = customers.filter((c) => {
    if (selectedSegment === 'ALL') return true;
    return c.segment === selectedSegment;
  });

  const breachCount = customers.filter(c => c.segment === 'CREDIT_LIMIT_BREACHED').length;
  const poorPayCount = customers.filter(c => c.segment === 'HIGH_SALES_POOR_COLLECTION').length;
  const reactivateCount = customers.filter(c => c.segment === 'REACTIVATION_OPPORTUNITY').length;

  return (
    <Card className="h-full flex flex-col border-navy-100 shadow-sm">
      <CardHeader
        title={
          <div className="flex items-center gap-2">
            <span className="font-bold text-navy-950 text-base">Customer Credit & Purchasing Cadence</span>
            <Badge variant="brass" size="sm" className="font-mono text-[9px] uppercase tracking-wider">
              Pattern Intelligence
            </Badge>
          </div>
        }
        description="Detection of credit limits, cycle disruptions, and reactivation opportunities"
        action={
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { id: 'ALL', label: 'All' },
              { id: 'CREDIT_LIMIT_BREACHED', label: `Breach (${breachCount})` },
              { id: 'HIGH_SALES_POOR_COLLECTION', label: `Overdue (${poorPayCount})` },
              { id: 'REACTIVATION_OPPORTUNITY', label: `Reactivate (${reactivateCount})` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedSegment(tab.id)}
                className={`px-2 py-0.5 text-[10px] font-semibold rounded-md transition-colors ${
                  selectedSegment === tab.id
                    ? 'bg-navy-900 text-white shadow-xs'
                    : 'bg-navy-50 text-navy-600 hover:bg-navy-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        }
      />

      <CardBody className="p-0 flex-1 flex flex-col justify-between">
        {isLoading ? (
          <div className="p-5 space-y-3 animate-pulse">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-navy-50 rounded-xl" />
            ))}
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
            <p className="text-xs font-semibold text-navy-900">Failed to load customer credit intelligence</p>
            <Button variant="ghost" size="sm" onClick={() => refetch()} className="mt-2 text-xs">
              Retry
            </Button>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="p-10 text-center flex flex-col items-center justify-center">
            <UserCheck className="w-9 h-9 text-emerald-500 mb-2" />
            <p className="text-xs font-bold text-navy-900">Healthy Customer Credit Portfolios</p>
            <p className="text-[11px] text-navy-500 max-w-xs mt-0.5">
              No accounts match the selected credit risk or reactivation filter.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-navy-100/70 overflow-y-auto max-h-[380px]">
            {filteredCustomers.map((cust) => (
              <div key={cust.customerId} className="p-4 hover:bg-navy-50/40 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <a href="/customers" className="font-bold text-xs text-navy-950 hover:text-blue-700">
                      {cust.customerName}
                    </a>
                    {cust.businessName && (
                      <span className="text-[10px] text-navy-500 font-medium">({cust.businessName})</span>
                    )}
                    {getSegmentBadge(cust.segment)}
                  </div>

                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span className="text-navy-500">
                      Sales: <strong className="text-navy-900">₹{Number(cust.totalSales).toLocaleString('en-IN')}</strong>
                    </span>
                    <span className={`font-bold ${cust.outstandingBalance > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                      Due: ₹{Number(cust.outstandingBalance).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-navy-700 leading-relaxed font-normal mb-2">
                  {cust.recommendation}
                </p>

                <div className="flex items-center justify-between text-[11px] text-navy-500 pt-1 border-t border-navy-50">
                  <div className="flex items-center gap-3">
                    <span>
                      Cadence:{' '}
                      <strong className="text-navy-700 font-mono">
                        {cust.avgOrderIntervalDays ? `~${cust.avgOrderIntervalDays}d interval` : 'Baseline pending'}
                      </strong>
                    </span>
                    {cust.daysSinceLastOrder !== undefined && (
                      <span>
                        Last Order:{' '}
                        <strong className="text-navy-700 font-mono">{cust.daysSinceLastOrder}d ago</strong>
                      </span>
                    )}
                    {cust.hasAdequateHistory === false && (
                      <span className="text-stone-400 font-medium text-[10px]">
                        (Preliminary history: &lt;2 orders)
                      </span>
                    )}
                  </div>

                  <a
                    href="/thread-ai"
                    className="text-[11px] font-semibold text-brass-800 hover:text-brass-900 flex items-center gap-1"
                  >
                    Draft Message in Thread AI →
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="p-3 bg-navy-50/50 border-t border-navy-100 flex items-center justify-between text-[11px] text-navy-500">
          <span>Credit and purchasing cadences refresh after every reconciled invoice and payment.</span>
          <a href="/customers" className="font-semibold text-navy-800 hover:underline">
            Manage Limits →
          </a>
        </div>
      </CardBody>
    </Card>
  );
};
