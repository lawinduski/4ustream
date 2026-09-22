'use client';

import dynamic from 'next/dynamic';

// Firebase must only run in the browser, so the providers are loaded client-side.
// The splash is part of the initial HTML, so the page never starts as a blank screen.
const AppRoot = dynamic(
  () => import('@/components/AppRoot').then((mod) => mod.AppRoot),
  {
    ssr: false,
    loading: () => (
      <div className="boot-splash" role="status" aria-label="Loading">
        <span />
      </div>
    ),
  }
);

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return <AppRoot>{children}</AppRoot>;
}
