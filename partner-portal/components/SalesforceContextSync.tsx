'use client';

import { useEffect, useState, createContext, useContext } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { SalesforcePostMessage } from '@/types/portal';

interface SalesforceContextType {
  sfUserId: string | null;
  sfOrigin: string | null;
  sendToast: (title: string, message: string, variant?: 'success' | 'error' | 'warning' | 'info') => void;
}

const SalesforceContext = createContext<SalesforceContextType>({
  sfUserId: null,
  sfOrigin: null,
  sendToast: () => {},
});

export function useSalesforce() {
  return useContext(SalesforceContext);
}

export default function SalesforceContextSync({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [sfUserId, setSfUserId] = useState<string | null>(null);
  const [sfOrigin, setSfOrigin] = useState<string | null>(null);

  useEffect(() => {
    const userIdParam = searchParams.get('sfUserId');
    const originParam = searchParams.get('origin');

    if (userIdParam) setSfUserId(userIdParam);
    if (originParam) setSfOrigin(originParam);
  }, [searchParams]);

  // Helper to post message securely to parent window
  const postToParent = (message: SalesforcePostMessage) => {
    if (typeof window === 'undefined' || window.parent === window) {
      return; // Not embedded in an iframe
    }

    // Determine target origin (never use "*")
    const targetOrigin = sfOrigin || (document.referrer ? new URL(document.referrer).origin : '');
    if (targetOrigin) {
      window.parent.postMessage(message, targetOrigin);
    }
  };

  const sendToast = (title: string, message: string, variant: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    postToParent({
      source: 'NEXTJS_APP',
      type: 'SHOW_TOAST',
      payload: { title, message, variant },
    });
  };

  // 1. Dynamic Height Resizing using ResizeObserver
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const sendHeight = () => {
      const height = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight,
        500
      );
      postToParent({
        source: 'NEXTJS_APP',
        type: 'RESIZE_HEIGHT',
        payload: { height },
      });
    };

    // Initial send
    sendHeight();

    const resizeObserver = new ResizeObserver(() => {
      sendHeight();
    });

    if (document.body) {
      resizeObserver.observe(document.body);
    }

    window.addEventListener('resize', sendHeight);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', sendHeight);
    };
  }, [sfOrigin, pathname]);

  // 2. Navigation Tracking
  useEffect(() => {
    if (!pathname) return;

    postToParent({
      source: 'NEXTJS_APP',
      type: 'NAVIGATION_CHANGE',
      payload: { path: pathname },
    });
  }, [pathname, sfOrigin]);

  return (
    <SalesforceContext.Provider value={{ sfUserId, sfOrigin, sendToast }}>
      {children}
    </SalesforceContext.Provider>
  );
}
