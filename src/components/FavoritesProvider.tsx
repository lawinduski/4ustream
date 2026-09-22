'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Favorite } from '@/lib/types';
import { getFavorites, readLocalFavorites, toggleFavorite } from '@/lib/favorites';
import { useApp } from './AppProvider';

type FavoritesContextType = {
  items: Favorite[];
  isFavorite: (id: string, type: Favorite['type']) => boolean;
  toggle: (item: Favorite) => Promise<boolean>;
};

const FavoritesContext = createContext<FavoritesContextType | null>(null);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useApp();
  const uid = user?.uid;
  const [items, setItems] = useState<Favorite[]>([]);

  useEffect(() => {
    let cancelled = false;
    getFavorites(uid)
      .then((list) => { if (!cancelled) setItems(list); })
      .catch(() => { if (!cancelled) setItems(readLocalFavorites()); });
    return () => { cancelled = true; };
  }, [uid]);

  const keys = useMemo(() => new Set(items.map((item) => `${item.type}:${item.id}`)), [items]);

  const isFavorite = useCallback(
    (id: string, type: Favorite['type']) => keys.has(`${type}:${id}`),
    [keys],
  );

  const toggle = useCallback(async (item: Favorite) => {
    const next = await toggleFavorite(uid, item);
    setItems((current) => {
      const rest = current.filter((x) => !(x.id === item.id && x.type === item.type));
      return next ? [item, ...rest] : rest;
    });
    return next;
  }, [uid]);

  const value = useMemo(() => ({ items, isFavorite, toggle }), [items, isFavorite, toggle]);

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('FavoritesProvider missing');
  return ctx;
}
