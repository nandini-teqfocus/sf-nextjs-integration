import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import {
  PartnerApplication,
  CreateApplicationPayload,
  CreateApplicationResponse,
  PaginationMetadata,
  PaginatedApplicationsResponse,
  GetApplicationsOptions,
} from '@/types/portal';

interface CachedToken {
  accessToken: string;
  instanceUrl: string;
  expiresAt: number;
}

let cachedToken: CachedToken | null = null;

function getPrivateKey(): string {
  const rawKey = process.env.SF_PRIVATE_KEY || process.env.SALESFORCE_PRIVATE_KEY;
  if (rawKey && rawKey.trim()) {
    let keyStr = rawKey.trim();
    if ((keyStr.startsWith('"') && keyStr.endsWith('"')) || (keyStr.startsWith("'") && keyStr.endsWith("'"))) {
      keyStr = keyStr.slice(1, -1);
    }
    keyStr = keyStr.replace(/\\n/g, '\n');
    return keyStr;
  }

  const keyPath = process.env.SF_PRIVATE_KEY_PATH || '../certs/server.key';
  const resolvedPath = path.isAbsolute(keyPath)
    ? keyPath
    : path.resolve(process.cwd(), keyPath);

  if (fs.existsSync(resolvedPath)) {
    return fs.readFileSync(resolvedPath, 'utf8');
  }

  const parentKeyPath = path.resolve(process.cwd(), '..', 'certs', 'server.key');
  if (fs.existsSync(parentKeyPath)) {
    return fs.readFileSync(parentKeyPath, 'utf8');
  }

  throw new Error('Salesforce private key not found in environment or file path');
}

export async function getSalesforceAccessToken(forceRefresh = false): Promise<{ accessToken: string; instanceUrl: string; cached: boolean }> {
  const now = Date.now();
  const EXPIRATION_BUFFER_MS = 5 * 60 * 1000; // 5 minute buffer

  if (!forceRefresh && cachedToken && cachedToken.expiresAt - now > EXPIRATION_BUFFER_MS) {
    return {
      accessToken: cachedToken.accessToken,
      instanceUrl: cachedToken.instanceUrl,
      cached: true,
    };
  }

  const clientId = process.env.SF_CLIENT_ID;
  const username = process.env.SF_USERNAME;
  const loginUrl = process.env.SF_LOGIN_URL || 'https://login.salesforce.com';

  if (!clientId || !username) {
    throw new Error('Missing Salesforce configuration: SF_CLIENT_ID or SF_USERNAME');
  }

  const privateKey = getPrivateKey();
  const expSeconds = Math.floor(now / 1000) + 300; // 5 minutes assertion expiry

  const tokenPayload = {
    iss: clientId,
    sub: username,
    aud: loginUrl,
    exp: expSeconds,
  };

  const assertion = jwt.sign(tokenPayload, privateKey, {
    algorithm: 'RS256',
    header: { alg: 'RS256', typ: 'JWT' },
  });

  const bodyParams = new URLSearchParams({
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion,
  });

  const tokenEndpoint = `${loginUrl}/services/oauth2/token`;
  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: bodyParams.toString(),
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Failed to authenticate with Salesforce OAuth (${response.status}): ${errorData}`);
  }

  const data = await response.json();
  const expiresInMs = 2 * 60 * 60 * 1000; // 2 hours session lifetime

  cachedToken = {
    accessToken: data.access_token,
    instanceUrl: data.instance_url,
    expiresAt: now + expiresInMs,
  };

  return {
    accessToken: cachedToken.accessToken,
    instanceUrl: cachedToken.instanceUrl,
    cached: false,
  };
}

function mapSalesforceRecord(rec: any): PartnerApplication {
  return {
    id: rec.Id,
    name: rec.Name,
    applicantName: rec.Applicant_Name__c || '',
    email: rec.Email__c || '',
    status: rec.Status__c || 'New',
    requestedAmount: rec.Requested_Amount__c || 0,
    notes: rec.Notes__c || '',
    createdDate: rec.CreatedDate,
    lastModifiedDate: rec.LastModifiedDate,
  };
}

// Function overloads for backward compatibility and type-safety
export async function getApplications(options: GetApplicationsOptions, retry?: boolean): Promise<PaginatedApplicationsResponse>;
export async function getApplications(status?: string, retry?: boolean): Promise<PartnerApplication[]>;
export async function getApplications(
  optionsOrStatus?: string | GetApplicationsOptions,
  retry = true
): Promise<PartnerApplication[] | PaginatedApplicationsResponse> {
  const { accessToken, instanceUrl } = await getSalesforceAccessToken();

  let status: string | undefined;
  let page: number | undefined;
  let pageSize: number | undefined;
  let isExplicitPagination = false;

  if (typeof optionsOrStatus === 'string') {
    status = optionsOrStatus;
  } else if (optionsOrStatus && typeof optionsOrStatus === 'object') {
    status = optionsOrStatus.status;
    page = optionsOrStatus.page;
    pageSize = optionsOrStatus.pageSize;
    if (page !== undefined || pageSize !== undefined) {
      isExplicitPagination = true;
    }
  }

  const queryParams = new URLSearchParams();
  if (status && status !== 'All') {
    queryParams.set('status', status);
  }
  if (page !== undefined && page !== null) {
    queryParams.set('page', String(page));
  }
  if (pageSize !== undefined && pageSize !== null) {
    queryParams.set('pageSize', String(pageSize));
  }

  const queryString = queryParams.toString();
  const endpoint = `${instanceUrl}/services/apexrest/v1/applications${queryString ? `?${queryString}` : ''}`;

  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    if (response.status === 401 && retry) {
      cachedToken = null;
      return getApplications(optionsOrStatus as any, false);
    }
    const errorBody = await response.json().catch(() => ({}));
    const errorMsg = errorBody.message || errorBody.error || `Apex REST GET failed (${response.status})`;
    const error: any = new Error(errorMsg);
    error.status = response.status;
    error.errorCode = errorBody.error;
    throw error;
  }

  const data: unknown = await response.json();

  // Normalize response: Flat array vs Paginated Envelope
  if (Array.isArray(data)) {
    const records = data.map(mapSalesforceRecord);
    if (isExplicitPagination) {
      return {
        records,
        pagination: {
          page: page || 1,
          pageSize: pageSize || 25,
          totalRecords: records.length,
          totalPages: Math.ceil(records.length / (pageSize || 25)) || 1,
          hasNext: false,
          hasPrevious: false,
        },
      };
    }
    return records;
  }

  if (data && typeof data === 'object' && 'records' in data) {
    const envelope = data as { records: any[]; pagination?: PaginationMetadata };
    const mappedRecords = Array.isArray(envelope.records) ? envelope.records.map(mapSalesforceRecord) : [];

    if (isExplicitPagination) {
      return {
        records: mappedRecords,
        pagination: envelope.pagination || {
          page: page || 1,
          pageSize: pageSize || 25,
          totalRecords: mappedRecords.length,
          totalPages: Math.ceil(mappedRecords.length / (pageSize || 25)) || 1,
          hasNext: false,
          hasPrevious: false,
        },
      };
    }

    return mappedRecords;
  }

  return [];
}

export async function createApplication(payload: CreateApplicationPayload, retry = true): Promise<CreateApplicationResponse> {
  const { accessToken, instanceUrl } = await getSalesforceAccessToken();

  const endpoint = `${instanceUrl}/services/apexrest/v1/applications`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    if (response.status === 401 && retry) {
      cachedToken = null;
      return createApplication(payload, false);
    }
    const errorText = await response.text();
    throw new Error(`Apex REST POST failed (${response.status}): ${errorText}`);
  }

  const responseData = await response.json();

  if (!responseData.success) {
    throw new Error(responseData.error || `Apex REST POST failed (${response.status})`);
  }

  return {
    success: true,
    recordId: responseData.recordId,
  };
}
