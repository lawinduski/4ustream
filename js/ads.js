import { collection, getDocs } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js';
import { db } from './firebase-init.js';

const CACHE_TTL = 15_000;

export async function getAds(activeOnly = true) {
  const key = '4u-ads';
  try {
    const raw = sessionStorage.getItem(key);
    if (raw) {
      const { time, data } = JSON.parse(raw);
      if (Date.now() - time < CACHE_TTL) {
        return data.filter(x => !activeOnly || x.enabled === true);
      }
    }
  } catch {}

  const snap = await getDocs(collection(db, 'ads'));
  const data = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  try {
    sessionStorage.setItem(key, JSON.stringify({ time: Date.now(), data }));
  } catch {}
  return data.filter(x => !activeOnly || x.enabled === true);
}
