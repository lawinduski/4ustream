'use client';

import { AppProvider } from './AppProvider';
import { BrandingProvider } from './BrandingProvider';
import { FavoritesProvider } from './FavoritesProvider';

export function AppRoot({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <FavoritesProvider>{children}</FavoritesProvider>
    </AppProvider>
  );
}
