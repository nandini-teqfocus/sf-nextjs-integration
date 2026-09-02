import React from 'react';
import { PaginationMetadata } from '@/types/portal';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationControlsProps {
  pagination: PaginationMetadata;
  onPageChange: (newPage: number) => void;
  onPageSizeChange: (newPageSize: number) => void;
  isLoading?: boolean;
}

export default function PaginationControls({
  pagination,
  onPageChange,
  onPageSizeChange,
  isLoading = false,
}: PaginationControlsProps) {
  const { page, pageSize, totalRecords, totalPages, hasNext, hasPrevious } = pagination;

  const startRecord = totalRecords === 0 ? 0 : (page - 1) * pageSize + 1;
  const endRecord = Math.min(page * pageSize, totalRecords);

  const pageSizeOptions = [10, 25, 50, 100];

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-white border-t border-slate-200 text-xs text-slate-600 rounded-b-xl">
      {/* Left: Record summary & Page Size selector */}
      <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
        <span className="font-medium text-slate-700">
          Showing <span className="font-semibold text-slate-900">{startRecord}</span>–<span className="font-semibold text-slate-900">{endRecord}</span> of{' '}
          <span className="font-semibold text-slate-900">{totalRecords}</span> application{totalRecords === 1 ? '' : 's'}
        </span>

        <div className="flex items-center gap-1.5 text-slate-500">
          <label htmlFor="pageSizeSelect" className="hidden xs:inline text-[11px]">
            Per page:
          </label>
          <select
            id="pageSizeSelect"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            disabled={isLoading || totalRecords === 0}
            aria-label="Select page size"
            className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-md px-2 py-1 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:opacity-50"
          >
            {pageSizeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Right: Page Switcher Buttons */}
      <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
        <span className="text-slate-600 font-medium mr-1" aria-live="polite">
          Page <span className="font-semibold text-slate-900">{totalPages === 0 ? 0 : page}</span> of{' '}
          <span className="font-semibold text-slate-900">{totalPages}</span>
        </span>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={!hasPrevious || isLoading}
            aria-label="Previous page"
            className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1 text-xs font-medium shadow-2xs"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Previous</span>
          </button>

          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={!hasNext || isLoading}
            aria-label="Next page"
            className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1 text-xs font-medium shadow-2xs"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
