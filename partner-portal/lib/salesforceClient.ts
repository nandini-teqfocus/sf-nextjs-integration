import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { PartnerApplication, CreateApplicationPayload, CreateApplicationResponse } from '@/types/portal';

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
    // Remove surrounding quotes if present
    if ((keyStr.startsWith('"') && keyStr.endsWith('"')) || (keyStr.startsWith("'") && keyStr.endsWith("'"))) {
      keyStr = keyStr.slice(1, -1);
    }
    // Replace literal escaped \n with actual newlines
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

  // Check parent directory if running inside partner-portal
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
  const expiresInMs = 2 * 60 * 60 * 1000; // 2 hours default Salesforce session lifetime

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

export async function getApplications(status?: string, retry = true): Promise<PartnerApplication[]> {
  const { accessToken, instanceUrl } = await getSalesforceAccessToken();

  let endpoint = `${instanceUrl}/services/apexrest/v1/applications`;
  if (status && status !== 'All') {
    endpoint += `?status=${encodeURIComponent(status)}`;
  }

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
      return getApplications(status, false);
    }
    const errorText = await response.text();
    throw new Error(`Apex REST GET failed (${response.status}): ${errorText}`);
  }

  const rawRecords: any[] = await response.json();

  return rawRecords.map((rec) => ({
    id: rec.Id,
    name: rec.Name,
    applicantName: rec.Applicant_Name__c || '',
    email: rec.Email__c || '',
    status: rec.Status__c || 'New',
    requestedAmount: rec.Requested_Amount__c || 0,
    notes: rec.Notes__c || '',
    createdDate: rec.CreatedDate,
    lastModifiedDate: rec.LastModifiedDate,
  }));
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
