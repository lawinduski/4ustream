'use client';

import { AppRoot } from '@/components/AppRoot';

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return <AppRoot>{children}</AppRoot>;
}
