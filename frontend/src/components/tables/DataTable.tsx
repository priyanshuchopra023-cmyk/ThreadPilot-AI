import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Search, Inbox } from 'lucide-react';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (row: T) => string;
  searchable?: boolean;
  searchKeys?: string[];
  sortable?: boolean;
  defaultSortKey?: string;
  defaultSortDirection?: 'asc' | 'desc';
  onRowClick?: (row: T) => void;
  loading?: boolean;
  emptyMessage?: string;
  emptyAction?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  pagination?: {
    enabled: boolean;
    pageSize?: number;
    onPageChange?: (page: number, pageSize: number) => void;
    totalItems?: number;
    currentPage?: number;
  };
  className?: string;
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  searchable = false,
  searchKeys = [],
  sortable = false,
  defaultSortKey,
  defaultSortDirection = 'asc',
  onRowClick,
  loading = false,
  emptyMessage = 'No data available',
  emptyAction,
  pagination,
  className = '',
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(defaultSortKey || null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(defaultSortDirection);
  const currentPage = pagination?.currentPage || 1;

  const normalizedData = useMemo<T[]>(() => {
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object' && Array.isArray((data as any).content)) {
      return (data as any).content as T[];
    }
    return [];
  }, [data]);

  const pageSize = pagination?.pageSize || 10;
  const totalItems = pagination?.totalItems ?? normalizedData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const filteredData = useMemo(() => {
    let result = normalizedData;

    if (searchTerm && searchable) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter((row) =>
        (searchKeys.length > 0 ? searchKeys : columns.map((c) => c.key)).some((key) => {
          const value = (row as Record<string, unknown>)[key];
          return value?.toString().toLowerCase().includes(lowerSearch);
        })
      );
    }

    if (sortKey && sortable) {
      result = [...result].sort((a, b) => {
        const aVal = (a as Record<string, unknown>)[sortKey];
        const bVal = (b as Record<string, unknown>)[sortKey];
        if (aVal === bVal) return 0;
        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return 1;
        if (bVal == null) return -1;
        const comparison = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    return result;
  }, [normalizedData, searchTerm, searchKeys, columns, sortKey, sortDirection, sortable, searchable]);

  // Handle client-side vs server-side slicing correctly
  const paginatedData = useMemo(() => {
    if (!pagination?.enabled) return filteredData;
    // If server-side pagination is active (onPageChange provided)
    if (pagination.onPageChange) {
      return filteredData;
    }
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, pagination?.enabled, pagination?.onPageChange, currentPage, pageSize]);

  const handleSort = (key: string) => {
    if (!sortable) return;
    if (sortKey === key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    pagination?.onPageChange?.(page, pageSize);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  if (loading) {
    return (
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-secondary-50/70 border-b border-secondary-200">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4.5 py-3 text-[11px] font-semibold text-secondary-600 uppercase tracking-wider"
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-secondary-100 bg-white">
            {[...Array(5)].map((_, i) => (
              <tr key={i} className="animate-pulse">
                {columns.map((col) => (
                  <td key={col.key} className="px-4.5 py-3.5">
                    <div className="h-4 bg-secondary-100 rounded-md w-3/4" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      {searchable && (
        <div className="mb-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400 w-4 h-4" />
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearch}
              placeholder="Search records..."
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-white border border-secondary-200 rounded-lg shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 placeholder:text-secondary-400"
            />
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-secondary-200/90 bg-white shadow-xs">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-secondary-50/70 border-b border-secondary-200/90 select-none">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`
                    px-4 py-3 text-[11px] font-semibold text-secondary-600 uppercase tracking-wider
                    ${col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'}
                    ${col.sortable && sortable ? 'cursor-pointer hover:text-navy-900 transition-colors' : ''}
                  `}
                  onClick={() => col.sortable && sortable && handleSort(col.key)}
                  style={{ width: col.width }}
                >
                  <div
                    className={`inline-flex items-center gap-1.5 ${
                      col.align === 'center'
                        ? 'justify-center'
                        : col.align === 'right'
                        ? 'justify-end'
                        : 'justify-start'
                    }`}
                  >
                    <span>{col.header}</span>
                    {col.sortable && sortable && (
                      <span className="text-secondary-400">
                        {sortKey === col.key ? (
                          sortDirection === 'asc' ? (
                            <ChevronUp className="w-3.5 h-3.5 text-navy-900" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-navy-900" />
                          )
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 opacity-40" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-secondary-100/90 bg-white">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-14 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-secondary-100 flex items-center justify-center text-secondary-400 mb-2.5">
                      <Inbox className="w-5 h-5" />
                    </div>
                    <p className="text-sm font-medium text-secondary-600">{emptyMessage}</p>
                    <p className="text-xs text-secondary-400 mt-0.5">Records will appear here once created</p>
                    {emptyAction && (
                      <div className="mt-4">
                        {emptyAction.href ? (
                          <a
                            href={emptyAction.href}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-navy-900 text-white hover:bg-navy-800 active:scale-[0.98] transition-all shadow-xs"
                          >
                            {emptyAction.label}
                          </a>
                        ) : (
                          <button
                            type="button"
                            onClick={emptyAction.onClick}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-navy-900 text-white hover:bg-navy-800 active:scale-[0.98] transition-all shadow-xs"
                          >
                            {emptyAction.label}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((row) => {
                const cells = columns.map((col) => {
                  const cellValue = col.render
                    ? col.render(row)
                    : (((row as Record<string, unknown>)[col.key]?.toString()) ?? '—');
                  return (
                    <td
                      key={col.key}
                      className={`
                        px-4 py-3.5 text-sm text-secondary-900 tabular-nums
                        ${col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'}
                      `}
                    >
                      {cellValue}
                    </td>
                  );
                });
                return (
                  <tr
                    key={keyExtractor(row)}
                    className={`
                      transition-colors duration-100
                      ${onRowClick ? 'cursor-pointer hover:bg-blue-50/40' : 'hover:bg-secondary-50/50'}
                    `}
                    onClick={() => onRowClick?.(row)}
                  >
                    {cells}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {pagination?.enabled && totalItems > 0 && (
        <div className="flex items-center justify-between mt-3.5 px-2">
          <div className="text-xs text-secondary-500 tabular-nums">
            Showing <span className="font-medium text-secondary-700">{(currentPage - 1) * pageSize + 1}</span> to{' '}
            <span className="font-medium text-secondary-700">{Math.min(currentPage * pageSize, totalItems)}</span> of{' '}
            <span className="font-medium text-secondary-700">{totalItems}</span> entries
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="p-1.5 border border-secondary-200 rounded-lg text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2.5 py-1 text-xs font-semibold text-navy-900 bg-secondary-100 rounded-md border border-secondary-200 tabular-nums">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="p-1.5 border border-secondary-200 rounded-lg text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataTable;
