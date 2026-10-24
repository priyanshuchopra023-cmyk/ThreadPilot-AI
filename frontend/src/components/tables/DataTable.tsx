import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Search } from 'lucide-react';

interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

interface DataTableProps<T> {
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
  pagination,
  className = '',
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(defaultSortKey || null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(defaultSortDirection);
  const [currentPage, setCurrentPage] = useState(pagination?.currentPage || 1);

  const normalizedData = useMemo<T[]>(() => {
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object' && Array.isArray((data as any).content)) {
      return (data as any).content as T[];
    }
    return [];
  }, [data]);

  const pageSize = pagination?.pageSize || 10;
  const totalItems = pagination?.totalItems ?? normalizedData.length;
  const totalPages = Math.ceil(totalItems / pageSize);

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
  }, [data, searchTerm, searchKeys, columns, sortKey, sortDirection, sortable]);

  const paginatedData = useMemo(() => {
    if (!pagination?.enabled) return filteredData;
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, pagination?.enabled, currentPage, pageSize]);

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
    setCurrentPage(page);
    pagination?.onPageChange?.(page, pageSize);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, i) => (
              <tr key={i}>
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3">
                    <div className="h-4 bg-secondary-200 animate-pulse rounded w-3/4" />
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
    <div className={className}>
      {searchable && (
        <div className="mb-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400 w-5 h-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearch}
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-secondary-50">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`
                    px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider
                    ${col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : ''}
                    ${col.sortable && sortable ? 'cursor-pointer hover:bg-secondary-50 select-none' : ''}
                    ${col.width ? `w-[${col.width}]` : ''}
                  `}
                  onClick={() => col.sortable && sortable && handleSort(col.key)}
                  style={{ width: col.width }}
                >
                  <div className="flex items-center gap-1">
                    {col.header}
                    {col.sortable && sortable && sortKey === col.key && (
                      sortDirection === 'asc' ? <ChevronUp className="w-4 h-4 text-primary-600" /> : <ChevronDown className="w-4 h-4 text-primary-600" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-secondary-200">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-secondary-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((row) => {
                const cells = columns.map((col) => {
                  const cellValue = col.render ? col.render(row) : (((row as Record<string, unknown>)[col.key]?.toString()) ?? '—');
                  return (
                    <td
                      key={col.key}
                      className={`
                        px-4 py-3 text-sm text-secondary-900
                        ${col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : ''}
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
                      ${onRowClick ? 'cursor-pointer hover:bg-secondary-50' : ''}
                      transition-colors
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

      {pagination?.enabled && totalItems > pageSize && (
        <div className="flex items-center justify-between mt-4 px-2">
          <div className="text-sm text-secondary-500">
            Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalItems)} of {totalItems} results
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 border border-secondary-300 rounded-lg hover:bg-secondary-50 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm font-medium text-secondary-700 w-20 text-center">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 border border-secondary-300 rounded-lg hover:bg-secondary-50 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Next page"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}