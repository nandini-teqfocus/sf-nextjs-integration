export interface PartnerApplication {
  id: string;
  name?: string;
  applicantName: string;
  email: string;
  status: 'New' | 'Under Review' | 'Approved' | 'Rejected' | string;
  requestedAmount: number;
  notes?: string;
  createdDate?: string;
  lastModifiedDate?: string;
}

export interface CreateApplicationPayload {
  applicantName: string;
  email: string;
  requestedAmount: number;
  notes?: string;
}

export interface CreateApplicationResponse {
  success: boolean;
  recordId?: string;
  error?: string;
}

export interface SalesforcePostMessage {
  source: 'NEXTJS_APP';
  type: 'SHOW_TOAST' | 'RESIZE_HEIGHT' | 'NAVIGATION_CHANGE';
  payload: {
    title?: string;
    message?: string;
    variant?: 'success' | 'error' | 'warning' | 'info';
    height?: number;
    path?: string;
  };
}
