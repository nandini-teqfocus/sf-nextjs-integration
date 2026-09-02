'use client';

import { useState, useEffect } from 'react';
import { Filter, Search } from 'lucide-react';

interface FilterPanelProps {
  currentStatus: string;
  onStatusChange: (status: string) => void;
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
}

const STATUS_OPTIONS = ['All', 'New', 'Under Review', 'Approved', 'Rejected'];

export default function FilterPanel({
  currentStatus,
  onStatusChange,
  searchTerm = '',
  onSearchChange,
}: FilterPanelProps) {
  const [localSearch, setLocalSearch] = useState(searchTerm);

  // Debounce search input (350ms)
  useEffect(() => {
    if (!onSearchChange) return;

    const timer = setTimeout(() => {
      onSearchChange(localSearch);
    }, 350);

    return () => clearTimeout(timer);
  }, [localSearch, onSearchChange]);

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
      {/* Status Filter Tabs */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-2 flex items-center gap-1">
          <Filter className="w-3.5 h-3.5" /> Status:
        </span>
        {STATUS_OPTIONS.map((status) => {
          const isActive = currentStatus === status;
          return (
            <button
              key={status}
              type="button"
              onClick={() => onStatusChange(status)}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm font-semibold'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {status}
            </button>
          );
        })}
      </div>

      {/* Optional Search Input */}
      {onSearchChange && (
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by applicant..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          />
        </div>
      )}
    </div>
  );
}
