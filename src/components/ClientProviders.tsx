'use client';

import { AppProvider } from '@/components/AppProvider';

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return <AppProvider>{children}</AppProvider>;
}
