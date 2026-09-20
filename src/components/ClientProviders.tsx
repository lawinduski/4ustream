'use client';

import dynamic from 'next/dynamic';

const AppProvider = dynamic(
  () => import('@/components/AppProvider').then((mod) => mod.AppProvider),
  { ssr: false }
);

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return <AppProvider>{children}</AppProvider>;
}
