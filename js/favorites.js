import { collection, deleteDoc, doc, getDoc, getDocs, setDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js';
import { db } from './firebase-init.js';

const KEY = '4u-favorites-v2';

export function readLocalFavorites() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

function localFavorite(id, value) {
  const current = readLocalFavorites();
  const exists = current.some(x => x.id === id && x.type === value.type);
  const next = exists
    ? current.filter(x => !(x.id === id && x.type === value.type))
    : [{ ...value, createdAt: Date.now() }, ...current];
  localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new Event('4u-favorites-changed'));
  return !exists;
}

export async function getFavorites(uid) {
  if (!uid) return readLocalFavorites();
  const snap = await getDocs(collection(db, 'users', uid, 'favorites'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function toggleFavorite(uid, value) {
  if (!uid) return localFavorite(value.id, value);
  const key = `${value.type}-${value.id}`;
  const ref = doc(db, 'users', uid, 'favorites', key);
  const existing = await getDoc(ref);
  let result;
  if (existing.exists()) {
    await deleteDoc(ref);
    result = false;
  } else {
    await setDoc(ref, { ...value, createdAt: serverTimestamp() });
    result = true;
  }
  window.dispatchEvent(new Event('4u-favorites-changed'));
  return result;
}
