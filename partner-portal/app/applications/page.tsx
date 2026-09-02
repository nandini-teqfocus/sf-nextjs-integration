import Link from 'next/link';
import { getApplications } from '@/lib/salesforceClient';
import ApplicationsClient from '@/components/applications/ApplicationsClient';
import { PartnerApplication } from '@/types/portal';
import { PlusCircle } from 'lucide-react';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Partner Applications | Partner Portal',
};

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams?: { status?: string };
}) {
  let initialApplications: PartnerApplication[] = [];
  let initialError: string | null = null;
  const statusParam = searchParams?.status || 'All';

  try {
    initialApplications = await getApplications(statusParam);
  } catch (err: any) {
    console.error('Server Component error fetching applications:', err.message);
    initialError = err.message || 'Failed to load applications from Salesforce';
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900">Partner Applications</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Review and track all submitted partner applications and funding requests.
          </p>
        </div>
        <Link
          href="/applications/new"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center gap-1.5 self-start sm:self-auto"
        >
          <PlusCircle className="w-3.5 h-3.5" /> Submit Application
        </Link>
      </div>

      {/* Interactive Client View */}
      <ApplicationsClient
        initialApplications={initialApplications}
        initialStatus={statusParam}
        initialError={initialError}
      />
    </div>
  );
}
