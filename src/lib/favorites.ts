import { collection, deleteDoc, doc, getDoc, getDocs, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Favorite } from '@/lib/types';

const KEY = '4u-favorites-v2';

type LocalFavorite = Favorite & { createdAt?: number };

// One Firestore favorites read per signed-in user per page session.
// Cards reuse this cache instead of each card reading the whole collection.
const remoteCache = new Map<string, Set<string>>();
const remotePromises = new Map<string, Promise<Set<string>>>();

function favoriteKey(value: Pick<Favorite, 'id' | 'type'>) {
  return `${value.type}-${value.id}`;
}

export function readLocalFavorites(): LocalFavorite[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]') as LocalFavorite[];
  } catch {
    return [];
  }
}

export function localFavorite(id: string, value: Favorite) {
  const current = readLocalFavorites();
  const exists = current.some(x => x.id === id && x.type === value.type);
  const next = exists
    ? current.filter(x => !(x.id === id && x.type === value.type))
    : [{ ...value, createdAt: Date.now() }, ...current];

  localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new Event('4u-favorites-changed'));
  return !exists;
}

async function loadRemoteFavorites(uid: string): Promise<Set<string>> {
  const cached = remoteCache.get(uid);
  if (cached) return cached;

  const pending = remotePromises.get(uid);
  if (pending) return pending;

  const request = getDocs(collection(db, 'users', uid, 'favorites'))
    .then(snap => {
      const set = new Set<string>();

      snap.docs.forEach(d => {
        const data = d.data() as Partial<Favorite>;
        const type =
          data.type === 'channel' || data.type === 'media'
            ? data.type
            : d.id.startsWith('channel-')
              ? 'channel'
              : 'media';

        const id = data.id || d.id.replace(/^(channel|media)-/, '');
        set.add(`${type}-${id}`);
      });

      remoteCache.set(uid, set);
      remotePromises.delete(uid);
      return set;
    })
    .catch(error => {
      remotePromises.delete(uid);
      throw error;
    });

  remotePromises.set(uid, request);
  return request;
}

export async function getFavorites(uid?: string): Promise<Favorite[]> {
  if (!uid) return readLocalFavorites();

  const snap = await getDocs(collection(db, 'users', uid, 'favorites'));
  const items = snap.docs.map(d => ({
    id: d.data().id || d.id.replace(/^(channel|media)-/, ''),
    ...d.data(),
  } as Favorite));

  remoteCache.set(uid, new Set(items.map(favoriteKey)));
  return items;
}

export async function isRemoteFavorite(
  uid: string | undefined,
  value: Pick<Favorite, 'id' | 'type'>
): Promise<boolean> {
  if (!uid) {
    return readLocalFavorites().some(
      x => x.id === value.id && x.type === value.type
    );
  }

  const set = await loadRemoteFavorites(uid);
  return set.has(favoriteKey(value));
}

export function clearFavoritesCache(uid?: string) {
  if (uid) {
    remoteCache.delete(uid);
    remotePromises.delete(uid);
    return;
  }

  remoteCache.clear();
  remotePromises.clear();
}

export async function toggleFavorite(
  uid: string | undefined,
  value: Favorite
): Promise<boolean> {
  if (!uid) return localFavorite(value.id, value);

  const favorites = await loadRemoteFavorites(uid);
  const key = favoriteKey(value);
  const ref = doc(db, 'users', uid, 'favorites', key);
  const current = await getDoc(ref);
  const exists = current.exists();

  if (exists) {
    await deleteDoc(ref);
    favorites.delete(key);
  } else {
    await setDoc(ref, { ...value, createdAt: serverTimestamp() });
    favorites.add(key);
  }

  window.dispatchEvent(new Event('4u-favorites-changed'));
  return !exists;
}
