import { collection, doc, getDoc, getDocs, query, where } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js';
import { getFirebase } from './firebase-init.js';

const CACHE_TTL = 15_000;

function cacheGet(key) {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const { time, data } = JSON.parse(raw);
    if (Date.now() - time > CACHE_TTL) return null;
    return data;
  } catch {
    return null;
  }
}

function cacheSet(key, data) {
  try {
    sessionStorage.setItem(key, JSON.stringify({ time: Date.now(), data }));
  } catch {
    /* storage full / private mode — ignore */
  }
}

export async function getChannels(activeOnly = true, vip = false) {
  const key = `4u-channels:${activeOnly}:${vip}`;
  const cached = cacheGet(key);
  if (cached) return cached;

  const { db } = await getFirebase();
  const ref = collection(db, 'channels');
  const constraints = activeOnly
    ? [where('enabled', '==', true), ...(vip ? [] : [where('accessLevel', '==', 'free')])]
    : [];
  const snap = await getDocs(constraints.length ? query(ref, ...constraints) : ref);
  const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  cacheSet(key, data);
  return data;
}

export async function getMedia(activeOnly = true, vip = false) {
  const key = `4u-media:${activeOnly}:${vip}`;
  const cached = cacheGet(key);
  if (cached) return cached;

  const { db } = await getFirebase();
  const ref = collection(db, 'media');
  const constraints = activeOnly
    ? [where('enabled', '==', true), ...(vip ? [] : [where('accessLevel', '==', 'free')])]
    : [];
  const snap = await getDocs(constraints.length ? query(ref, ...constraints) : ref);
  const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  cacheSet(key, data);
  return data;
}

export async function getMediaById(id) {
  const { db } = await getFirebase();
  const snap = await getDoc(doc(db, 'media', id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function getEpisodes(dramaId, vip = false) {
  const key = `4u-episodes:${dramaId}:${vip}`;
  const cached = cacheGet(key);
  if (cached) return cached;

  const { db } = await getFirebase();
  const ref = collection(db, 'episodes');
  const constraints = [
    where('dramaId', '==', dramaId),
    where('enabled', '==', true),
    ...(vip ? [] : [where('accessLevel', '==', 'free')]),
  ];
  const snap = await getDocs(query(ref, ...constraints));
  const data = snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => a.seasonNumber - b.seasonNumber || a.episodeNumber - b.episodeNumber);
  cacheSet(key, data);
  return data;
}

export async function getEpisodeById(id) {
  const { db } = await getFirebase();
  const snap = await getDoc(doc(db, 'episodes', id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}
