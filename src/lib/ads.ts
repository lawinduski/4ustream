import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { AdBanner } from '@/lib/types';

let adsCache: AdBanner[] | null = null;
let adsPromise: Promise<AdBanner[]> | null = null;

export function clearAdsCache() {
  adsCache = null;
  adsPromise = null;
}

export async function getAds(activeOnly = true): Promise<AdBanner[]> {
  if (activeOnly && adsCache) return adsCache;

  if (activeOnly && adsPromise) return adsPromise;

  const request = getDocs(
    query(collection(db, 'ads'), where('enabled', '==', true))
  )
    .then(snap => {
      const result = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as AdBanner))
        .filter(x => !activeOnly || x.enabled === true)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

      if (activeOnly) {
        adsCache = result;
        adsPromise = null;
      }

      return result;
    })
    .catch(error => {
      if (activeOnly) adsPromise = null;
      throw error;
    });

  if (activeOnly) adsPromise = request;
  return request;
}
