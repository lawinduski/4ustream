import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Channel, MediaItem } from '@/lib/types';

/**
 * Firestore is the only runtime source of truth.
 * Static starter catalogs are intentionally not imported here so their
 * stream metadata cannot be bundled into client-side pages.
 */
export async function getChannels(activeOnly = true): Promise<Channel[]> {
  const ref = collection(db, 'channels');
  const snap = await getDocs(activeOnly ? query(ref, where('enabled', '==', true)) : ref);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Channel));
}

export async function getMedia(activeOnly = true): Promise<MediaItem[]> {
  const ref = collection(db, 'media');
  const snap = await getDocs(activeOnly ? query(ref, where('enabled', '==', true)) : ref);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as MediaItem));
}

export async function getMediaById(id: string) {
  const snap = await getDoc(doc(db, 'media', id));
  if (!snap.exists()) return null;
  const item = { id: snap.id, ...snap.data() } as MediaItem;
  return item.enabled === false ? null : item;
}
