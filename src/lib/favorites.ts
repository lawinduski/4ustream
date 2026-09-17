import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';

import { db } from '@/lib/firebase';
import type { Favorite } from '@/lib/types';

const KEY = '4u-favorites-v2';

type LocalFavorite = Favorite & {
  createdAt?: number;
};

const favoritesCache = new Map<
  string,
  {
    time: number;
    data: Favorite[];
  }
>();

const CACHE_TTL = 15_000;

export function readLocalFavorites(): LocalFavorite[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    return JSON.parse(
      localStorage.getItem(KEY) || '[]'
    ) as LocalFavorite[];
  } catch {
    return [];
  }
}

export function localFavorite(
  id: string,
  value: Favorite
) {
  const current = readLocalFavorites();

  const exists = current.some(
    x =>
      x.id === id &&
      x.type === value.type
  );

  const next = exists
    ? current.filter(
        x =>
          !(
            x.id === id &&
            x.type === value.type
          )
      )
    : [
        {
          ...value,
          createdAt: Date.now(),
        },
        ...current,
      ];

  localStorage.setItem(
    KEY,
    JSON.stringify(next)
  );

  window.dispatchEvent(
    new Event('4u-favorites-changed')
  );

  return !exists;
}

export async function getFavorites(
  uid?: string
): Promise<Favorite[]> {
  if (!uid) {
    return readLocalFavorites();
  }

  const cached = favoritesCache.get(uid);

  if (
    cached &&
    Date.now() - cached.time < CACHE_TTL
  ) {
    return cached.data;
  }

  const snap = await getDocs(
    collection(db, 'users', uid, 'favorites')
  );

  const data = snap.docs.map(
    d =>
      ({
        id: d.id,
        ...d.data(),
      } as Favorite)
  );

  favoritesCache.set(uid, {
    time: Date.now(),
    data,
  });

  return data;
}

export async function toggleFavorite(
  uid: string | undefined,
  value: Favorite
): Promise<boolean> {
  if (!uid) {
    return localFavorite(
      value.id,
      value
    );
  }

  const key = `${value.type}-${value.id}`;

  const ref = doc(
    db,
    'users',
    uid,
    'favorites',
    key
  );

  const existing = await getDoc(ref);

  let result: boolean;

  if (existing.exists()) {
    await deleteDoc(ref);
    result = false;
  } else {
    await setDoc(ref, {
      ...value,
      createdAt: serverTimestamp(),
    });

    result = true;
  }

  favoritesCache.delete(uid);

  window.dispatchEvent(
    new Event('4u-favorites-changed')
  );

  return result;
}
