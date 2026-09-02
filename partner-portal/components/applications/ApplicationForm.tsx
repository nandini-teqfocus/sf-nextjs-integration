'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSalesforce } from '@/components/SalesforceContextSync';
import { CreateApplicationPayload } from '@/types/portal';
import { Send, CheckCircle2, AlertTriangle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ApplicationForm() {
  const router = useRouter();
  const { sendToast } = useSalesforce();

  const [formData, setFormData] = useState<CreateApplicationPayload>({
    applicantName: '',
    email: '',
    requestedAmount: 50000,
    notes: '',
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [createdRecordId, setCreatedRecordId] = useState<string | null>(null);

  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.applicantName.trim()) {
      newErrors.applicantName = 'Applicant Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = 'Please enter a valid email address';
      }
    }

    if (formData.requestedAmount === undefined || formData.requestedAmount === null || formData.requestedAmount <= 0) {
      newErrors.requestedAmount = 'Requested amount must be a positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit application');
      }

      setCreatedRecordId(data.recordId);

      // Dispatch SHOW_TOAST postMessage event to Salesforce Experience Cloud
      sendToast('Application Submitted', 'Partner application created successfully in Salesforce', 'success');

      // Navigate back to applications list after 1.5 seconds
      setTimeout(() => {
        router.push('/applications');
      }, 1500);
    } catch (err: any) {
      setServerError(err.message || 'An unexpected error occurred. Please try again.');
      sendToast('Submission Error', err.message || 'Failed to create application', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl border border-slate-200 shadow-sm p-6 md:p-8">
      <div className="flex items-center justify-between pb-6 border-b border-slate-100 mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Submit Partner Application</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Submit a new funding/partnership application directly into Salesforce.
          </p>
        </div>
        <Link
          href="/applications"
          className="text-xs font-medium text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to list
        </Link>
      </div>

      {serverError && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-3 text-rose-800 text-xs">
          <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Submission Failed</p>
            <p className="mt-0.5">{serverError}</p>
          </div>
        </div>
      )}

      {createdRecordId && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-3 text-emerald-800 text-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Application Created Successfully!</p>
            <p className="mt-0.5">Salesforce Record ID: <code className="font-mono bg-emerald-100 px-1 py-0.5 rounded">{createdRecordId}</code></p>
            <p className="mt-1 text-slate-500 text-[11px]">Redirecting to applications list...</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Applicant Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Applicant Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Acme Corporation / John Doe"
            value={formData.applicantName}
            onChange={(e) => {
              setFormData({ ...formData, applicantName: e.target.value });
              if (errors.applicantName) setErrors({ ...errors, applicantName: '' });
            }}
            className={`w-full px-3.5 py-2 text-xs rounded-lg border bg-slate-50 focus:bg-white focus:outline-none transition-colors ${
              errors.applicantName
                ? 'border-rose-400 focus:ring-2 focus:ring-rose-200'
                : 'border-slate-200 focus:ring-2 focus:ring-blue-500'
            }`}
          />
          {errors.applicantName && (
            <p className="text-[11px] text-rose-600 mt-1">{errors.applicantName}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Email Address <span className="text-rose-500">*</span>
          </label>
          <input
            type="email"
            placeholder="e.g. partner@example.com"
            value={formData.email}
            onChange={(e) => {
              setFormData({ ...formData, email: e.target.value });
              if (errors.email) setErrors({ ...errors, email: '' });
            }}
            className={`w-full px-3.5 py-2 text-xs rounded-lg border bg-slate-50 focus:bg-white focus:outline-none transition-colors ${
              errors.email
                ? 'border-rose-400 focus:ring-2 focus:ring-rose-200'
                : 'border-slate-200 focus:ring-2 focus:ring-blue-500'
            }`}
          />
          {errors.email && (
            <p className="text-[11px] text-rose-600 mt-1">{errors.email}</p>
          )}
        </div>

        {/* Requested Amount */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Requested Amount ($ USD) <span className="text-rose-500">*</span>
          </label>
          <input
            type="number"
            min="1"
            step="100"
            placeholder="50000"
            value={formData.requestedAmount}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setFormData({ ...formData, requestedAmount: isNaN(val) ? 0 : val });
              if (errors.requestedAmount) setErrors({ ...errors, requestedAmount: '' });
            }}
            className={`w-full px-3.5 py-2 text-xs rounded-lg border bg-slate-50 focus:bg-white focus:outline-none transition-colors ${
              errors.requestedAmount
                ? 'border-rose-400 focus:ring-2 focus:ring-rose-200'
                : 'border-slate-200 focus:ring-2 focus:ring-blue-500'
            }`}
          />
          {errors.requestedAmount && (
            <p className="text-[11px] text-rose-600 mt-1">{errors.requestedAmount}</p>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Application Notes / Details
          </label>
          <textarea
            rows={4}
            placeholder="Provide context, justification, or comments regarding this partner application..."
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          />
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting || !!createdRecordId}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Submitting to Salesforce...
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" /> Submit Application
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
