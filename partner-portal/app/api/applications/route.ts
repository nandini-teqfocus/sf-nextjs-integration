import { NextRequest, NextResponse } from 'next/server';
import { getApplications, createApplication } from '@/lib/salesforceClient';
import { CreateApplicationPayload, GetApplicationsOptions } from '@/types/portal';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const pageParam = searchParams.get('page');
    const pageSizeParam = searchParams.get('pageSize');

    let page: number | undefined;
    let pageSize: number | undefined;
    const isExplicitPagination = pageParam !== null || pageSizeParam !== null;

    // Validate page parameter if supplied
    if (pageParam !== null) {
      const parsedPage = Number(pageParam);
      if (!Number.isInteger(parsedPage) || parsedPage < 1) {
        return NextResponse.json(
          { error: 'Page parameter must be an integer greater than or equal to 1' },
          { status: 400 }
        );
      }
      page = parsedPage;
    }

    // Validate pageSize parameter if supplied
    if (pageSizeParam !== null) {
      const parsedPageSize = Number(pageSizeParam);
      if (!Number.isInteger(parsedPageSize) || parsedPageSize < 1 || parsedPageSize > 100) {
        return NextResponse.json(
          { error: 'PageSize parameter must be an integer between 1 and 100' },
          { status: 400 }
        );
      }
      pageSize = parsedPageSize;
    }

    if (isExplicitPagination) {
      const options: GetApplicationsOptions = {
        status,
        page: page || 1,
        pageSize: pageSize || 25,
      };
      const paginatedResult = await getApplications(options);
      return NextResponse.json(paginatedResult, { status: 200 });
    }

    // Backward-compatible response: Flat array when no pagination params are provided
    const applications = await getApplications(status);
    return NextResponse.json(applications, { status: 200 });
  } catch (error: any) {
    console.error('Error in GET /api/applications:', error.message);
    const statusCode = error.status || (error.errorCode === 'PAGE_OUT_OF_RANGE' ? 400 : 500);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch applications from Salesforce' },
      { status: statusCode }
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
