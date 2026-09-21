import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Channel, DramaEpisode, MediaItem } from '@/lib/types';

const listCache = new Map<string, Channel[] | MediaItem[]>();
const listPromises = new Map<string, Promise<Channel[] | MediaItem[]>>();
const itemCache = new Map<string, MediaItem | DramaEpisode | null>();
const itemPromises = new Map<string, Promise<MediaItem | DramaEpisode | null>>();

function listKey(type: 'channels' | 'media', activeOnly: boolean, vip: boolean) {
  return `${type}:${activeOnly ? 1 : 0}:${vip ? 1 : 0}`;
}

export function clearContentCache() {
  listCache.clear();
  listPromises.clear();
  itemCache.clear();
  itemPromises.clear();
}

export async function getChannels(activeOnly = true, vip = false): Promise<Channel[]> {
  const key = listKey('channels', activeOnly, vip);
  const cached = listCache.get(key) as Channel[] | undefined;
  if (cached) return cached;

  const pending = listPromises.get(key) as Promise<Channel[]> | undefined;
  if (pending) return pending;

  const ref = collection(db, 'channels');
  const constraints = activeOnly
    ? [where('enabled', '==', true), ...(vip ? [] : [where('accessLevel', '==', 'free')])]
    : [];

  const request = getDocs(constraints.length ? query(ref, ...constraints) : ref)
    .then(snap => {
      const result = snap.docs.map(d => ({ id: d.id, ...d.data() } as Channel));
      listCache.set(key, result);
      listPromises.delete(key);
      return result;
    })
    .catch(error => {
      listPromises.delete(key);
      throw error;
    });

  listPromises.set(key, request);
  return request;
}

export async function getMedia(activeOnly = true, vip = false): Promise<MediaItem[]> {
  const key = listKey('media', activeOnly, vip);
  const cached = listCache.get(key) as MediaItem[] | undefined;
  if (cached) return cached;

  const pending = listPromises.get(key) as Promise<MediaItem[]> | undefined;
  if (pending) return pending;

  const ref = collection(db, 'media');
  const constraints = activeOnly
    ? [where('enabled', '==', true), ...(vip ? [] : [where('accessLevel', '==', 'free')])]
    : [];

  const request = getDocs(constraints.length ? query(ref, ...constraints) : ref)
    .then(snap => {
      const result = snap.docs.map(d => ({ id: d.id, ...d.data() } as MediaItem));
      listCache.set(key, result);
      listPromises.delete(key);
      return result;
    })
    .catch(error => {
      listPromises.delete(key);
      throw error;
    });

  listPromises.set(key, request);
  return request;
}

export async function getMediaById(id: string): Promise<MediaItem | null> {
  const key = `media:${id}`;
  if (itemCache.has(key)) return itemCache.get(key) as MediaItem | null;

  const pending = itemPromises.get(key) as Promise<MediaItem | null> | undefined;
  if (pending) return pending;

  const request = getDoc(doc(db, 'media', id))
    .then(snap => {
      const result = snap.exists()
        ? ({ id: snap.id, ...snap.data() } as MediaItem)
        : null;
      itemCache.set(key, result);
      itemPromises.delete(key);
      return result;
    })
    .catch(error => {
      itemPromises.delete(key);
      throw error;
    });

  itemPromises.set(key, request);
  return request;
}

export async function getEpisodes(dramaId: string, vip = false): Promise<DramaEpisode[]> {
  const key = `episodes:${dramaId}:${vip ? 1 : 0}`;
  const cached = listCache.get(key) as DramaEpisode[] | undefined;
  if (cached) return cached;

  const pending = listPromises.get(key) as Promise<DramaEpisode[]> | undefined;
  if (pending) return pending;

  const ref = collection(db, 'episodes');
  const constraints = [
    where('dramaId', '==', dramaId),
    where('enabled', '==', true),
    ...(vip ? [] : [where('accessLevel', '==', 'free')]),
  ];

  const request = getDocs(query(ref, ...constraints))
    .then(snap => {
      const result = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as DramaEpisode))
        .sort((a, b) => a.seasonNumber - b.seasonNumber || a.episodeNumber - b.episodeNumber);

      listCache.set(key, result);
      listPromises.delete(key);
      return result;
    })
    .catch(error => {
      listPromises.delete(key);
      throw error;
    });

  listPromises.set(key, request);
  return request;
}

export async function getEpisodeById(id: string): Promise<DramaEpisode | null> {
  const key = `episode:${id}`;
  if (itemCache.has(key)) return itemCache.get(key) as DramaEpisode | null;

  const pending = itemPromises.get(key) as Promise<DramaEpisode | null> | undefined;
  if (pending) return pending;

  const request = getDoc(doc(db, 'episodes', id))
    .then(snap => {
      const result = snap.exists()
        ? ({ id: snap.id, ...snap.data() } as DramaEpisode)
        : null;
      itemCache.set(key, result);
      itemPromises.delete(key);
      return result;
    })
    .catch(error => {
      itemPromises.delete(key);
      throw error;
    });

  itemPromises.set(key, request);
  return request;
}
