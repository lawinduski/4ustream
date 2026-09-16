import { collection, deleteDoc, doc, getDocs, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Favorite } from '@/lib/types';

const KEY = '4u-favorites-v2';

type LocalFavorite = Favorite & { createdAt?: number };

export function readLocalFavorites(): LocalFavorite[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') as LocalFavorite[]; } catch { return []; }
}

export function localFavorite(id: string, value: Favorite) {
  const current = readLocalFavorites();
  const exists = current.some(x => x.id === id && x.type === value.type);
  const next = exists ? current.filter(x => !(x.id === id && x.type === value.type)) : [{ ...value, createdAt: Date.now() }, ...current];
  localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new Event('4u-favorites-changed'));
  return !exists;
}

export async function getFavorites(uid?: string): Promise<Favorite[]> {
  if (!uid) return readLocalFavorites();
  const snap = await getDocs(collection(db, 'users', uid, 'favorites'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Favorite));
}

export async function toggleFavorite(uid: string | undefined, value: Favorite): Promise<boolean> {
  if (!uid) return localFavorite(value.id, value);
  const key = `${value.type}-${value.id}`;
  const ref = doc(db, 'users', uid, 'favorites', key);
  const current = await getDocs(collection(db, 'users', uid, 'favorites'));
  const exists = current.docs.some(d => d.id === key);
  if (exists) await deleteDoc(ref);
  else await setDoc(ref, { ...value, createdAt: serverTimestamp() });
  window.dispatchEvent(new Event('4u-favorites-changed'));
  return !exists;
}
