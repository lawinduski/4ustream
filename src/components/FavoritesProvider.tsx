'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Favorite } from '@/lib/types';
import { getFavorites, readLocalFavorites, toggleFavorite } from '@/lib/favorites';
import { useApp } from './AppProvider';

type FavoritesContextType = {
  isFavorite: (id: string, type: Favorite['type']) => boolean;
  toggle: (item: Favorite) => Promise<boolean>;
};

const FavoritesContext = createContext<FavoritesContextType | null>(null);

/**
 * Loads the favorites list once per user and shares it with every card.
 * Previously each card ran its own Firestore query, which meant dozens of
 * identical requests on the home page and one per channel on /live.
 */
export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useApp();
  const uid = user?.uid;
  const [items, setItems] = useState<Favorite[]>([]);

  useEffect(() => {
    let cancelled = false;

    const load = () =>
      getFavorites(uid)
        .then((list) => { if (!cancelled) setItems(list); })
        .catch(() => { if (!cancelled) setItems(readLocalFavorites()); });

    load();
    window.addEventListener('4u-favorites-changed', load);

    return () => {
      cancelled = true;
      window.removeEventListener('4u-favorites-changed', load);
    };
  }, [uid]);

  const keys = useMemo(() => new Set(items.map((x) => `${x.type}:${x.id}`)), [items]);

  const isFavorite = useCallback(
    (id: string, type: Favorite['type']) => keys.has(`${type}:${id}`),
    [keys]
  );

  const toggle = useCallback(
    async (item: Favorite) => {
      const next = await toggleFavorite(uid, item);
      setItems((prev) => {
        const rest = prev.filter((x) => !(x.id === item.id && x.type === item.type));
        return next ? [item, ...rest] : rest;
      });
      return next;
    },
    [uid]
  );

  const value = useMemo(() => ({ isFavorite, toggle }), [isFavorite, toggle]);

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('FavoritesProvider missing');
  return ctx;
}
