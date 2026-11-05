import React, { useState } from 'react';
import { 
  Package, 
  AlertTriangle, 
  ArrowRight, 
  ExternalLink, 
  TrendingUp, 
  Layers, 
  Clock, 
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardBody } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { analyticsApi } from '../../api/endpoints';
import type { TextileProductIntelligence } from '../../types';

export const TextileIntelligenceCard: React.FC = () => {
  const [filterTrend, setFilterTrend] = useState<string>('ALL');

  const { data: textileIntel, isLoading, error, refetch } = useQuery<TextileProductIntelligence[]>({
    queryKey: ['textile-product-intelligence'],
    queryFn: async () => {
      const res = await analyticsApi.getTextileProductIntelligence();
      return (res.data || []) as TextileProductIntelligence[];
    },
  });

  const getTrendBadge = (trend: string) => {
    switch (trend) {
      case 'OUT_OF_STOCK_DEMAND_LOST':
        return <Badge variant="danger" size="sm" dot>Stockout / Demand Lost</Badge>;
      case 'FAST_MOVING_CRITICAL_STOCK':
        return <Badge variant="danger" size="sm" dot>Critical (&le;7d Stock)</Badge>;
      case 'FAST_MOVING_REPLENISH_SOON':
        return <Badge variant="warning" size="sm" dot>Replenish Soon (&le;15d)</Badge>;
      case 'SLOW_MOVING_DEADSTOCK':
        return <Badge variant="brass" size="sm" dot>Deadstock Alert</Badge>;
      case 'NEW_PRODUCT_COLLECTING_DATA':
        return <Badge variant="secondary" size="sm">New Line (&lt;14d)</Badge>;
      default:
        return <Badge variant="success" size="sm">Steady Performer</Badge>;
    }
  };

  const items = textileIntel || [];
  const filteredItems = items.filter((item) => {
    if (filterTrend === 'ALL') return true;
    if (filterTrend === 'CRITICAL') return item.demandTrend === 'OUT_OF_STOCK_DEMAND_LOST' || item.demandTrend === 'FAST_MOVING_CRITICAL_STOCK';
    if (filterTrend === 'REPLENISH') return item.demandTrend === 'FAST_MOVING_REPLENISH_SOON';
    if (filterTrend === 'DEADSTOCK') return item.demandTrend === 'SLOW_MOVING_DEADSTOCK';
    if (filterTrend === 'PRELIMINARY') return item.dataQualityStatus === 'PRELIMINARY_DATA';
    return true;
  });

  const criticalCount = items.filter(i => i.demandTrend === 'OUT_OF_STOCK_DEMAND_LOST' || i.demandTrend === 'FAST_MOVING_CRITICAL_STOCK').length;
  const replenishCount = items.filter(i => i.demandTrend === 'FAST_MOVING_REPLENISH_SOON').length;
  const deadstockCount = items.filter(i => i.demandTrend === 'SLOW_MOVING_DEADSTOCK').length;

  return (
    <Card className="h-full flex flex-col border-navy-100 shadow-sm">
      <CardHeader
        title={
          <div className="flex items-center gap-2">
            <span className="font-bold text-navy-950 text-base">Textile & Hosiery Inventory Velocity</span>
            <Badge variant="brass" size="sm" className="font-mono text-[9px] uppercase tracking-wider">
              30-Day Moving Cadence
            </Badge>
          </div>
        }
        description="Depletion velocities, stock coverage horizons, and deadstock protection for newly introduced yarns"
        action={
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { id: 'ALL', label: 'All Items' },
              { id: 'CRITICAL', label: `Critical (${criticalCount})` },
              { id: 'REPLENISH', label: `Replenish (${replenishCount})` },
              { id: 'DEADSTOCK', label: `Deadstock (${deadstockCount})` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterTrend(tab.id)}
                className={`px-2 py-0.5 text-[10px] font-semibold rounded-md transition-colors ${
                  filterTrend === tab.id
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
            <p className="text-xs font-semibold text-navy-900">Failed to load textile inventory intelligence</p>
            <Button variant="ghost" size="sm" onClick={() => refetch()} className="mt-2 text-xs">
              Retry
            </Button>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-10 text-center flex flex-col items-center justify-center">
            <CheckCircle2 className="w-9 h-9 text-emerald-500 mb-2" />
            <p className="text-xs font-bold text-navy-900">Balanced Inventory Stock</p>
            <p className="text-[11px] text-navy-500 max-w-xs mt-0.5">
              All yarn spindles and garment lines currently hold safe inventory coverage.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-navy-100/70 overflow-y-auto max-h-[380px]">
            {filteredItems.map((prod) => (
              <div key={prod.productId} className="p-4 hover:bg-navy-50/40 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-navy-900">{prod.sku}</span>
                    <span className="text-xs font-semibold text-navy-900">{prod.productName}</span>
                    {prod.category && (
                      <span className="text-[10px] text-navy-500 px-1.5 py-0.2 rounded bg-stone-100">
                        {prod.category}
                      </span>
                    )}
                    {getTrendBadge(prod.demandTrend)}
                  </div>

                  <div className="flex items-center gap-4 text-xs font-mono">
                    <span className="text-navy-600">
                      Stock: <strong className="text-navy-900">{prod.currentStock}</strong>
                    </span>
                    <span className="text-navy-600">
                      Velocity: <strong className="text-navy-900">{prod.dailyVelocity} u/day</strong>
                    </span>
                    {prod.daysOfStock !== undefined && prod.daysOfStock !== null && (
                      <span className={`font-bold ${prod.daysOfStock <= 7 ? 'text-rose-600' : 'text-navy-800'}`}>
                        Coverage: ~{prod.daysOfStock}d
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-xs text-navy-700 leading-relaxed font-normal mb-2">
                  {prod.recommendation}
                </p>

                <div className="flex items-center justify-between text-[11px] text-navy-500 pt-1 border-t border-navy-50">
                  <div className="flex items-center gap-3">
                    <span className="text-navy-600">
                      30-Day Sales: <strong className="text-navy-900 font-mono">{prod.unitsSold30Days} units</strong>
                    </span>
                    {prod.dataQualityStatus === 'PRELIMINARY_DATA' ? (
                      <span className="text-blue-700 font-medium text-[10px] bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                        Preliminary Data (&lt;14d old, safe from deadstock)
                      </span>
                    ) : (
                      <span className="text-emerald-700 font-medium text-[10px] bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                        Verified 30-Day Movement
                      </span>
                    )}
                  </div>

                  <a
                    href="/inventory"
                    className="text-[11px] font-semibold text-navy-800 hover:text-blue-700 flex items-center gap-1"
                  >
                    Manage Inventory <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="p-3 bg-navy-50/50 border-t border-navy-100 flex items-center justify-between text-[11px] text-navy-500">
          <span>Replenishment velocities recalculate automatically with every fulfilled sale.</span>
          <a href="/inventory" className="font-semibold text-navy-800 hover:underline">
            View All Stock →
          </a>
        </div>
      </CardBody>
    </Card>
  );
};
