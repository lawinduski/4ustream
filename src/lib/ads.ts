import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { AdBanner } from '@/lib/types';

const CACHE_TTL = 15_000;

let adsCache: {
  time: number;
  data: AdBanner[];
} | null = null;

export async function getAds(
  activeOnly = true
): Promise<AdBanner[]> {
  if (
    adsCache &&
    Date.now() - adsCache.time < CACHE_TTL
  ) {
    return adsCache.data.filter(
      x => !activeOnly || x.enabled === true
    );
  }

  const snap = await getDocs(collection(db, 'ads'));

  const data = snap.docs
    .map(
      d => ({ id: d.id, ...d.data() } as AdBanner)
    )
    .sort(
      (a, b) =>
        (a.order ?? 0) - (b.order ?? 0)
    );

  adsCache = {
    time: Date.now(),
    data,
  };

  return data.filter(
    x => !activeOnly || x.enabled === true
  );
}
