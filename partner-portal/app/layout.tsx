import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import SalesforceContextSync from '@/components/SalesforceContextSync';
import { LayoutDashboard, FileText, PlusCircle, ShieldCheck } from 'lucide-react';
import './globals.css';

export const metadata: Metadata = {
  title: 'Partner Application Portal',
  description: 'Next.js 14 Salesforce Experience Cloud Embedded Portal POC',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 min-h-screen flex flex-col font-sans antialiased">
        <Suspense fallback={null}>
          <SalesforceContextSync>
            {/* Navigation Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
              <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
                {/* Brand / Logo */}
                <Link href="/" className="flex items-center gap-2 text-slate-900 font-bold text-sm tracking-tight hover:opacity-90 transition-opacity">
                  <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-sm font-black text-xs">
                    SF
                  </div>
                  <span>Partner Portal</span>
                </Link>

                {/* Nav Links */}
                <nav className="flex items-center gap-1 sm:gap-2">
                  <Link
                    href="/"
                    className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-blue-600 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Dashboard</span>
                  </Link>
                  <Link
                    href="/applications"
                    className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-blue-600 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Applications</span>
                  </Link>
                  <Link
                    href="/applications/new"
                    className="ml-1 sm:ml-2 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-all flex items-center gap-1.5"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>New Application</span>
                  </Link>
                </nav>
              </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 md:p-8">
              {children}
            </main>

            {/* Footer */}
            <footer className="border-t border-slate-200 bg-white/60 py-3 text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Next.js 14 App Router &mdash; Apex REST &mdash; JWT Bearer OAuth Protected</span>
            </footer>
          </SalesforceContextSync>
        </Suspense>
      </body>
    </html>
  );
}
