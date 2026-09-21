import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Channel, DramaEpisode, MediaItem } from '@/lib/types';

export async function getChannels(activeOnly = true, vip = false): Promise<Channel[]> {
  const ref = collection(db, 'channels');
  const constraints = activeOnly
    ? [where('enabled', '==', true), ...(vip ? [] : [where('accessLevel', '==', 'free')])]
    : [];
  const snap = await getDocs(constraints.length ? query(ref, ...constraints) : ref);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Channel));
}

export async function getMedia(activeOnly = true, vip = false): Promise<MediaItem[]> {
  const ref = collection(db, 'media');
  const constraints = activeOnly
    ? [where('enabled', '==', true), ...(vip ? [] : [where('accessLevel', '==', 'free')])]
    : [];
  const snap = await getDocs(constraints.length ? query(ref, ...constraints) : ref);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as MediaItem));
}

export async function getMediaById(id: string) {
  const snap = await getDoc(doc(db, 'media', id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as MediaItem;
}

export async function getEpisodes(dramaId: string, vip = false): Promise<DramaEpisode[]> {
  const ref = collection(db, 'episodes');
  const constraints = [where('dramaId', '==', dramaId), where('enabled', '==', true), ...(vip ? [] : [where('accessLevel', '==', 'free')])];
  const snap = await getDocs(query(ref, ...constraints));
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() } as DramaEpisode))
    .sort((a, b) => a.seasonNumber - b.seasonNumber || a.episodeNumber - b.episodeNumber);
}

export async function getEpisodeById(id: string) {
  const snap = await getDoc(doc(db, 'episodes', id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as DramaEpisode;
}
