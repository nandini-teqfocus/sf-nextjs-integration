import { getApplications } from '@/lib/salesforceClient';
import DashboardClient from '@/components/dashboard/DashboardClient';
import { PartnerApplication } from '@/types/portal';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'Dashboard | Partner Application Portal',
};

export default async function DashboardRoutePage() {
  let initialApplications: PartnerApplication[] = [];
  let initialError: string | null = null;

  try {
    initialApplications = await getApplications();
  } catch (error: any) {
    console.error('Initial load of applications for /dashboard failed:', error.message);
    initialError = error.message || 'Unable to connect to Salesforce.';
  }

  return (
    <DashboardClient
      initialApplications={initialApplications}
      initialError={initialError}
    />
  );
}
