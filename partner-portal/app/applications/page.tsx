import Link from 'next/link';
import { getApplications } from '@/lib/salesforceClient';
import ApplicationsClient from '@/components/applications/ApplicationsClient';
import { PartnerApplication, PaginationMetadata } from '@/types/portal';
import { PlusCircle } from 'lucide-react';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Partner Applications | Partner Portal',
};

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams?: { status?: string; page?: string; pageSize?: string };
}) {
  let initialApplications: PartnerApplication[] = [];
  let initialPagination: PaginationMetadata = {
    page: 1,
    pageSize: 25,
    totalRecords: 0,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false,
  };
  let initialError: string | null = null;

  const statusParam = searchParams?.status || 'All';
  const pageParam = searchParams?.page ? parseInt(searchParams.page, 10) : 1;
  const pageSizeParam = searchParams?.pageSize ? parseInt(searchParams.pageSize, 10) : 25;

  try {
    const result = await getApplications({
      status: statusParam,
      page: isNaN(pageParam) ? 1 : pageParam,
      pageSize: isNaN(pageSizeParam) ? 25 : pageSizeParam,
    });

    initialApplications = result.records;
    initialPagination = result.pagination;
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
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-all flex items-center gap-1.5 self-start sm:self-auto"
        >
          <PlusCircle className="w-3.5 h-3.5" /> Submit Application
        </Link>
      </div>

      {/* Interactive Client View */}
      <ApplicationsClient
        initialApplications={initialApplications}
        initialPagination={initialPagination}
        initialStatus={statusParam}
        initialError={initialError}
      />
    </div>
  );
}
