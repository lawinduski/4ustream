import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Channel, DramaEpisode, FilmPart, MediaItem } from '@/lib/types';

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

// A film split into parts (e.g. Part 1 / Part 2) because the source file was too long
// to host as a single stream. Films with no parts play directly, unaffected.
export async function getFilmParts(mediaId: string, vip = false): Promise<FilmPart[]> {
  const ref = collection(db, 'parts');
  const constraints = [where('mediaId', '==', mediaId), where('enabled', '==', true), ...(vip ? [] : [where('accessLevel', '==', 'free')])];
  const snap = await getDocs(query(ref, ...constraints));
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() } as FilmPart))
    .sort((a, b) => a.partNumber - b.partNumber);
}

export async function getFilmPartById(id: string) {
  const snap = await getDoc(doc(db, 'parts', id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as FilmPart;
}
