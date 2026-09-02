'use client';

import { useState, useEffect, useCallback } from 'react';
import { PartnerApplication } from '@/types/portal';
import FilterPanel from '@/components/applications/FilterPanel';
import ApplicationTable from '@/components/applications/ApplicationTable';
import { RefreshCw, AlertCircle } from 'lucide-react';

interface ApplicationsClientProps {
  initialApplications: PartnerApplication[];
  initialStatus?: string;
  initialError?: string | null;
}

export default function ApplicationsClient({
  initialApplications,
  initialStatus = 'All',
  initialError = null,
}: ApplicationsClientProps) {
  const [applications, setApplications] = useState<PartnerApplication[]>(initialApplications);
  const [selectedStatus, setSelectedStatus] = useState<string>(initialStatus);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(initialError);
  const [isFirstRender, setIsFirstRender] = useState<boolean>(true);

  const fetchApplications = useCallback(async (status: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const url = status === 'All' ? '/api/applications' : `/api/applications?status=${encodeURIComponent(status)}`;
      const res = await fetch(url);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `HTTP ${res.status}`);
      }
      const data: PartnerApplication[] = await res.json();
      setApplications(data);
    } catch (err: any) {
      console.error('Failed to fetch applications:', err);
      setError(err.message || 'Failed to load applications from Salesforce');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isFirstRender) {
      setIsFirstRender(false);
      return;
    }
    fetchApplications(selectedStatus);
  }, [selectedStatus, fetchApplications, isFirstRender]);

  // Client-side search filtering by applicant name or email
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
      {/* Refresh Trigger */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500 font-medium">
          Showing {filteredApplications.length} application{filteredApplications.length === 1 ? '' : 's'}
        </span>
        <button
          type="button"
          onClick={() => fetchApplications(selectedStatus)}
          disabled={isLoading}
          className="p-1.5 text-slate-500 hover:text-slate-800 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-xs text-xs font-medium transition-all disabled:opacity-50 flex items-center gap-1"
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
        onStatusChange={(status) => setSelectedStatus(status)}
        searchTerm={searchTerm}
        onSearchChange={(term) => setSearchTerm(term)}
      />

      {/* Applications Table */}
      <ApplicationTable applications={filteredApplications} isLoading={isLoading} />
    </div>
  );
}
