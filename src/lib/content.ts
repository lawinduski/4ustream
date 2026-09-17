import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Channel, DramaEpisode, MediaItem } from '@/lib/types';

const CACHE_TTL = 15_000;

const channelsCache = new Map<string, { time: number; data: Channel[] }>();
const mediaCache = new Map<string, { time: number; data: MediaItem[] }>();
const episodesCache = new Map<string, { time: number; data: DramaEpisode[] }>();

export async function getChannels(
  activeOnly = true,
  vip = false
): Promise<Channel[]> {
  const key = `${activeOnly}:${vip}`;
  const cached = channelsCache.get(key);

  if (cached && Date.now() - cached.time < CACHE_TTL) {
    return cached.data;
  }

  const ref = collection(db, 'channels');

  const constraints = activeOnly
    ? [
        where('enabled', '==', true),
        ...(vip ? [] : [where('accessLevel', '==', 'free')]),
      ]
    : [];

  const snap = await getDocs(
    constraints.length ? query(ref, ...constraints) : ref
  );

  const data = snap.docs.map(
    d => ({ id: d.id, ...d.data() } as Channel)
  );

  channelsCache.set(key, {
    time: Date.now(),
    data,
  });

  return data;
}

export async function getMedia(
  activeOnly = true,
  vip = false
): Promise<MediaItem[]> {
  const key = `${activeOnly}:${vip}`;
  const cached = mediaCache.get(key);

  if (cached && Date.now() - cached.time < CACHE_TTL) {
    return cached.data;
  }

  const ref = collection(db, 'media');

  const constraints = activeOnly
    ? [
        where('enabled', '==', true),
        ...(vip ? [] : [where('accessLevel', '==', 'free')]),
      ]
    : [];

  const snap = await getDocs(
    constraints.length ? query(ref, ...constraints) : ref
  );

  const data = snap.docs.map(
    d => ({ id: d.id, ...d.data() } as MediaItem)
  );

  mediaCache.set(key, {
    time: Date.now(),
    data,
  });

  return data;
}

export async function getMediaById(id: string) {
  const snap = await getDoc(doc(db, 'media', id));

  if (!snap.exists()) {
    return null;
  }

  return {
    id: snap.id,
    ...snap.data(),
  } as MediaItem;
}

export async function getEpisodes(
  dramaId: string,
  vip = false
): Promise<DramaEpisode[]> {
  const key = `${dramaId}:${vip}`;
  const cached = episodesCache.get(key);

  if (cached && Date.now() - cached.time < CACHE_TTL) {
    return cached.data;
  }

  const ref = collection(db, 'episodes');

  const constraints = [
    where('dramaId', '==', dramaId),
    where('enabled', '==', true),
    ...(vip ? [] : [where('accessLevel', '==', 'free')]),
  ];

  const snap = await getDocs(query(ref, ...constraints));

  const data = snap.docs
    .map(d => ({ id: d.id, ...d.data() } as DramaEpisode))
    .sort(
      (a, b) =>
        a.seasonNumber - b.seasonNumber ||
        a.episodeNumber - b.episodeNumber
    );

  episodesCache.set(key, {
    time: Date.now(),
    data,
  });

  return data;
}

export async function getEpisodeById(id: string) {
  const snap = await getDoc(doc(db, 'episodes', id));

  if (!snap.exists()) {
    return null;
  }

  return {
    id: snap.id,
    ...snap.data(),
  } as DramaEpisode;
}
