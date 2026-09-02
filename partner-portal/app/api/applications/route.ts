import { NextRequest, NextResponse } from 'next/server';
import { getApplications, createApplication } from '@/lib/salesforceClient';
import { CreateApplicationPayload } from '@/types/portal';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;

    const applications = await getApplications(status);
    return NextResponse.json(applications, { status: 200 });
  } catch (error: any) {
    console.error('Error in GET /api/applications:', error.message);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch applications from Salesforce' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateApplicationPayload = await request.json();

    // Server-side validation
    if (!body.applicantName || !body.applicantName.trim()) {
      return NextResponse.json(
        { error: 'Applicant name is required' },
        { status: 400 }
      );
    }

    if (!body.email || !body.email.trim()) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    if (body.requestedAmount === undefined || body.requestedAmount === null || body.requestedAmount <= 0) {
      return NextResponse.json(
        { error: 'Requested amount must be a positive number' },
        { status: 400 }
      );
    }

    const result = await createApplication(body);
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/applications:', error.message);
    return NextResponse.json(
      { error: error.message || 'Failed to create application in Salesforce' },
      { status: 400 }
    );
  }
}
