'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { PartnerApplication } from '@/types/portal';
import { FileText, PlusCircle, Clock, CheckCircle2, XCircle, AlertCircle, TrendingUp, RefreshCw } from 'lucide-react';

interface DashboardClientProps {
  initialApplications: PartnerApplication[];
  initialError?: string | null;
}

export default function DashboardClient({
  initialApplications = [],
  initialError = null,
}: DashboardClientProps) {
  const [applications, setApplications] = useState<PartnerApplication[]>(initialApplications);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(initialError);

  const refreshApplications = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/applications', { cache: 'no-store' });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || `HTTP ${res.status}`);
      }
      const data: PartnerApplication[] = await res.json();
      setApplications(data);
      setError(null);
    } catch (err: any) {
      console.error('Failed to refresh dashboard applications:', err.message);
      // If client fetch fails, retain initial applications unless empty
      if (applications.length === 0) {
        setError(err.message || 'Unable to connect to Salesforce');
      }
    } finally {
      setIsLoading(false);
    }
  }, [applications.length]);

  // Sync on mount and when window gains focus
  useEffect(() => {
    refreshApplications();

    const handleFocus = () => {
      refreshApplications();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refreshApplications]);

  // Calculate live statistics
  const total = applications.length;
  const countNew = applications.filter((a) => a.status === 'New').length;
  const countReview = applications.filter((a) => a.status === 'Under Review').length;
  const countApproved = applications.filter((a) => a.status === 'Approved').length;
  const countRejected = applications.filter((a) => a.status === 'Rejected').length;
  const totalFunding = applications.reduce((sum, a) => sum + (a.requestedAmount || 0), 0);

  const formatCurrency = (amt: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amt);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 rounded-2xl p-6 md:p-8 text-white shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/20 text-white backdrop-blur-sm mb-2">
              <TrendingUp className="w-3 h-3" /> Salesforce Experience Cloud Integrated
            </span>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Partner Application Portal</h1>
            <p className="text-blue-100 text-xs md:text-sm mt-1 max-w-xl">
              Submit and track your partner funding requests in real-time. All data is securely synchronized with Salesforce Apex REST.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={refreshApplications}
              disabled={isLoading}
              className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-all disabled:opacity-50"
              title="Refresh Dashboard"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <Link
              href="/applications"
              className="px-4 py-2 bg-white text-blue-700 hover:bg-blue-50 text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" /> View Applications
            </Link>
            <Link
              href="/applications/new"
              className="px-4 py-2 bg-blue-800/80 hover:bg-blue-800 text-white border border-white/20 text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center gap-1.5"
            >
              <PlusCircle className="w-3.5 h-3.5" /> Submit New Application
            </Link>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs">
          <p className="font-semibold">Notice regarding Salesforce Connection:</p>
          <p className="mt-0.5">{error}</p>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        {/* Total Applications */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm col-span-2 md:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">{total}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">{formatCurrency(totalFunding)} requested</div>
          </div>
        </div>

        {/* New */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">New</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-blue-700">{countNew}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Awaiting initial review</div>
          </div>
        </div>

        {/* Under Review */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Under Review</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-amber-700">{countReview}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">In committee review</div>
          </div>
        </div>

        {/* Approved */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Approved</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-emerald-700">{countApproved}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Ready for disbursement</div>
          </div>
        </div>

        {/* Rejected */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-600 uppercase tracking-wider">Rejected</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-rose-700">{countRejected}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Closed / unapproved</div>
          </div>
        </div>
      </div>

      {/* Quick Action Banner */}
      <div className="bg-slate-100/70 border border-slate-200 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Ready to submit a new funding request?</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Applications are submitted through Apex REST and undergo automated FLS & validation checks.
          </p>
        </div>
        <Link
          href="/applications/new"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all whitespace-nowrap"
        >
          Start Application Form ?
        </Link>
      </div>
    </div>
  );
}
