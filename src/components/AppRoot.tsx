'use client';

import { AppProvider } from './AppProvider';
import { FavoritesProvider } from './FavoritesProvider';

export function AppRoot({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <FavoritesProvider>{children}</FavoritesProvider>
    </AppProvider>
  );
}
