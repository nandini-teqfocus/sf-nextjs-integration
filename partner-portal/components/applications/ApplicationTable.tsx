import { PartnerApplication } from '@/types/portal';
import { FileText, Clock, CheckCircle2, XCircle, AlertCircle, Building2 } from 'lucide-react';

interface ApplicationTableProps {
  applications: PartnerApplication[];
  isLoading?: boolean;
}

export default function ApplicationTable({ applications, isLoading = false }: ApplicationTableProps) {
  if (isLoading) {
    return (
      <div className="p-12 text-center">
        <div className="inline-block animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mb-3" />
        <p className="text-sm font-medium text-slate-500">Loading applications from Salesforce...</p>
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="p-12 text-center">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
          <Building2 className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-slate-900">No applications found</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          There are no partner applications matching the selected filter criteria.
        </p>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'New':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <AlertCircle className="w-3 h-3" /> New
          </span>
        );
      case 'Under Review':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3" /> Under Review
          </span>
        );
      case 'Approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" /> Approved
          </span>
        );
      case 'Rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3" /> Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  const formatCurrency = (amt?: number) => {
    if (amt === undefined || amt === null) return '$0';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amt);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
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
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
            <th className="py-3 px-4">Application #</th>
            <th className="py-3 px-4">Applicant / Partner</th>
            <th className="py-3 px-4">Email</th>
            <th className="py-3 px-4">Requested Amount</th>
            <th className="py-3 px-4">Status</th>
            <th className="py-3 px-4">Created Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {applications.map((app) => (
            <tr key={app.id || app.name} className="hover:bg-slate-50/80 transition-colors">
              <td className="py-3 px-4 font-semibold text-blue-600 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span>{app.name || 'New'}</span>
              </td>
              <td className="py-3 px-4 font-medium text-slate-900">{app.applicantName}</td>
              <td className="py-3 px-4 text-slate-500">{app.email}</td>
              <td className="py-3 px-4 font-semibold text-slate-900">{formatCurrency(app.requestedAmount)}</td>
              <td className="py-3 px-4">{getStatusBadge(app.status)}</td>
              <td className="py-3 px-4 text-slate-400">{formatDate(app.createdDate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
