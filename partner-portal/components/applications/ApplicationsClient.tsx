'use client';

import { useState, useCallback } from 'react';
import { PartnerApplication, PaginationMetadata } from '@/types/portal';
import FilterPanel from '@/components/applications/FilterPanel';
import ApplicationTable from '@/components/applications/ApplicationTable';
import PaginationControls from '@/components/applications/PaginationControls';
import { RefreshCw, AlertCircle } from 'lucide-react';

interface ApplicationsClientProps {
  initialApplications: PartnerApplication[];
  initialPagination?: PaginationMetadata;
  initialStatus?: string;
  initialError?: string | null;
}

export default function ApplicationsClient({
  initialApplications,
  initialPagination,
  initialStatus = 'All',
  initialError = null,
}: ApplicationsClientProps) {
  const [applications, setApplications] = useState<PartnerApplication[]>(initialApplications);
  const [pagination, setPagination] = useState<PaginationMetadata>(
    initialPagination || {
      page: 1,
      pageSize: 25,
      totalRecords: initialApplications.length,
      totalPages: Math.ceil(initialApplications.length / 25) || (initialApplications.length > 0 ? 1 : 0),
      hasNext: false,
      hasPrevious: false,
    }
  );

  const [selectedStatus, setSelectedStatus] = useState<string>(initialStatus);
  const [currentPage, setCurrentPage] = useState<number>(initialPagination?.page || 1);
  const [pageSize, setPageSize] = useState<number>(initialPagination?.pageSize || 25);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(initialError);

  const fetchApplications = useCallback(
    async (status: string, page: number, size: number) => {
      setIsLoading(true);
      setError(null);
      try {
        const queryParams = new URLSearchParams();
        if (status && status !== 'All') {
          queryParams.set('status', status);
        }
        queryParams.set('page', String(page));
        queryParams.set('pageSize', String(size));

        const res = await fetch(`/api/applications?${queryParams.toString()}`);
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || errorData.message || `HTTP ${res.status}`);
        }

        const data = await res.json();
        if (data && 'records' in data && 'pagination' in data) {
          setApplications(data.records);
          setPagination(data.pagination);
        } else if (Array.isArray(data)) {
          setApplications(data);
          setPagination({
            page,
            pageSize: size,
            totalRecords: data.length,
            totalPages: Math.ceil(data.length / size) || (data.length > 0 ? 1 : 0),
            hasNext: false,
            hasPrevious: page > 1,
          });
        }
      } catch (err: any) {
        console.error('Failed to fetch applications:', err);
        setError(err.message || 'Failed to load applications from Salesforce');
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const handleStatusChange = (newStatus: string) => {
    setSelectedStatus(newStatus);
    setCurrentPage(1);
    fetchApplications(newStatus, 1, pageSize);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    fetchApplications(selectedStatus, newPage, pageSize);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
    fetchApplications(selectedStatus, 1, newPageSize);
  };

  // Client-side search filtering applies across the currently loaded page
  const filteredApplications = applications.filter((app) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      app.applicantName.toLowerCase().includes(term) ||
      app.email.toLowerCase().includes(term) ||
      (app.name && app.name.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-5">
      {/* Action and Refresh Header */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-slate-500 font-medium">
          {searchTerm.trim() ? (
            <span>
              Matching <span className="font-semibold text-slate-800">{filteredApplications.length}</span> of{' '}
              <span className="font-semibold text-slate-800">{applications.length}</span> records on this page
            </span>
          ) : (
            <span>
              Total records in Salesforce:{' '}
              <span className="font-semibold text-slate-800">{pagination.totalRecords}</span>
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => fetchApplications(selectedStatus, currentPage, pageSize)}
          disabled={isLoading}
          className="p-1.5 text-slate-500 hover:text-slate-800 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-2xs text-xs font-medium transition-all disabled:opacity-50 flex items-center gap-1 cursor-pointer"
          title="Refresh records from Salesforce"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
          <span className="text-[11px] hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <div>
            <span className="font-semibold">Error:</span> {error}
          </div>
        </div>
      )}

      {/* Filter Panel */}
      <FilterPanel
        currentStatus={selectedStatus}
        onStatusChange={handleStatusChange}
        searchTerm={searchTerm}
        onSearchChange={(term) => setSearchTerm(term)}
      />

      {/* Applications Table & Integrated Pagination Controls */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <ApplicationTable applications={filteredApplications} isLoading={isLoading} />
        <PaginationControls
          pagination={pagination}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
