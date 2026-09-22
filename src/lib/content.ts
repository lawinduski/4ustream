import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Channel, DramaEpisode, MediaItem, MediaPart } from '@/lib/types';

const CACHE_TTL = 30_000;
const listCache = new Map<string, { expires: number; promise: Promise<unknown> }>();

function cached<T>(key: string, loader: () => Promise<T>): Promise<T> {
  const hit = listCache.get(key);
  if (hit && hit.expires > Date.now()) return hit.promise as Promise<T>;
  const promise = loader();
  listCache.set(key, { expires: Date.now() + CACHE_TTL, promise });
  promise.catch(() => {
    if (listCache.get(key)?.promise === promise) listCache.delete(key);
  });
  return promise;
}

function mapDocs<T>(docs: { id: string; data(): Record<string, unknown> }[]): T[] {
  return docs.map((item) => ({ id: item.id, ...item.data() }) as T);
}

export function getChannels(
  activeOnly = true,
  vip = false,
  maxResults?: number,
): Promise<Channel[]> {
  const key = `channels:${activeOnly}:${vip}:${maxResults ?? 'all'}`;
  return cached(key, async () => {
    const ref = collection(db, 'channels');
    const constraints = activeOnly
      ? [
          where('enabled', '==', true),
          ...(vip ? [] : [where('accessLevel', '==', 'free')]),
        ]
      : [];
    const base = constraints.length ? query(ref, ...constraints) : ref;
    const snap = maxResults ? await getDocs(query(base, limit(maxResults))) : await getDocs(base);
    return mapDocs<Channel>(snap.docs);
  });
}

export function getMedia(
  activeOnly = true,
  vip = false,
  maxResults?: number,
): Promise<MediaItem[]> {
  const key = `media:${activeOnly}:${vip}:${maxResults ?? 'all'}`;
  return cached(key, async () => {
    const ref = collection(db, 'media');
    const constraints = activeOnly
      ? [
          where('enabled', '==', true),
          ...(vip ? [] : [where('accessLevel', '==', 'free')]),
        ]
      : [];
    const base = constraints.length ? query(ref, ...constraints) : ref;
    const snap = maxResults ? await getDocs(query(base, limit(maxResults))) : await getDocs(base);
    return mapDocs<MediaItem>(snap.docs);
  });
}

export function getMediaById(id: string, vip = false): Promise<MediaItem | null> {
  return cached(`media:${id}:${vip}`, async () => {
    const snap = await getDoc(doc(db, 'media', id));
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as MediaItem) : null;
  });
}

export function getEpisodes(dramaId: string, vip = false): Promise<DramaEpisode[]> {
  return cached(`episodes:${dramaId}:${vip}`, async () => {
    const constraints = [
      where('dramaId', '==', dramaId),
      where('enabled', '==', true),
      ...(vip ? [] : [where('accessLevel', '==', 'free')]),
    ];
    const snap = await getDocs(query(collection(db, 'episodes'), ...constraints));
    return mapDocs<DramaEpisode>(snap.docs).sort(
      (a, b) => a.seasonNumber - b.seasonNumber || a.episodeNumber - b.episodeNumber,
    );
  });
}

export function getEpisodeById(id: string, vip = false): Promise<DramaEpisode | null> {
  return cached(`episode:${id}:${vip}`, async () => {
    const snap = await getDoc(doc(db, 'episodes', id));
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as DramaEpisode) : null;
  });
}

export function getFilmParts(mediaId: string, vip = false): Promise<MediaPart[]> {
  return cached(`parts:${mediaId}:${vip}`, async () => {
    const constraints = [
      where('mediaId', '==', mediaId),
      where('enabled', '==', true),
      ...(vip ? [] : [where('accessLevel', '==', 'free')]),
    ];
    const snap = await getDocs(query(collection(db, 'parts'), ...constraints));
    return mapDocs<MediaPart>(snap.docs).sort((a, b) => a.partNumber - b.partNumber);
  });
}

export function getFilmPartById(id: string, vip = false): Promise<MediaPart | null> {
  return cached(`part:${id}:${vip}`, async () => {
    const snap = await getDoc(doc(db, 'parts', id));
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as MediaPart) : null;
  });
}
