'use client';

import { PartnerApplication } from '@/types/portal';
import { FileText, Inbox, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

interface ApplicationTableProps {
  applications: PartnerApplication[];
  isLoading?: boolean;
}

export default function ApplicationTable({ applications, isLoading = false }: ApplicationTableProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mb-3"></div>
        <p className="text-sm text-slate-500 font-medium">Loading applications from Salesforce...</p>
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
          <Inbox className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-800">No applications found</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          No records match the selected status or no partner applications have been submitted yet.
        </p>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'New':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
            <AlertCircle className="w-3 h-3" /> New
          </span>
        );
      case 'Under Review':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/60">
            <Clock className="w-3 h-3" /> Under Review
          </span>
        );
      case 'Approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
            <CheckCircle2 className="w-3 h-3" /> Approved
          </span>
        );
      case 'Rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/60">
            <XCircle className="w-3 h-3" /> Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
            <tr>
              <th className="py-3 px-4">Application #</th>
              <th className="py-3 px-4">Applicant Name</th>
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4 text-right">Requested Amount</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {applications.map((app) => (
              <tr key={app.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="py-3 px-4 font-semibold text-slate-900 flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  {app.name || app.id.slice(0, 8)}
                </td>
                <td className="py-3 px-4 text-slate-800 font-medium">
                  {app.applicantName}
                  {app.notes && (
                    <p className="text-[11px] text-slate-400 font-normal line-clamp-1 mt-0.5">
                      {app.notes}
                    </p>
                  )}
                </td>
                <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">{app.email}</td>
                <td className="py-3 px-4 text-right font-semibold text-slate-900">
                  {formatCurrency(app.requestedAmount)}
                </td>
                <td className="py-3 px-4">{getStatusBadge(app.status)}</td>
                <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                  {formatDate(app.createdDate)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
