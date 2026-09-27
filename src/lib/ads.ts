import { collection, getDocs, limit, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { AdAudience, AdBanner } from '@/lib/types';

function toMillis(value: unknown): number | null {
  if (!value) return null;
  if (typeof value === 'number') return value;
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'string') {
    const time = Date.parse(value);
    return Number.isFinite(time) ? time : null;
  }
  if (typeof value === 'object' && value !== null && 'toMillis' in value) {
    const result = (value as { toMillis?: () => number }).toMillis?.();
    return typeof result === 'number' ? result : null;
  }
  return null;
}

export function isAdScheduled(ad: AdBanner, now = Date.now()): boolean {
  const start = toMillis(ad.startAt);
  const end = toMillis(ad.endAt);
  return (start === null || now >= start) && (end === null || now <= end);
}

export function isAdAllowedForAudience(ad: AdBanner, audience: AdAudience): boolean {
  const target = ad.audience ?? 'all';
  return target === 'all' || target === audience;
}

export function normalizeAd(ad: AdBanner): AdBanner {
  return {
    ...ad,
    placement: ad.placement ?? 'banner',
    audience: ad.audience ?? 'all',
    order: Number.isFinite(ad.order) ? ad.order : 0,
    priority: Number.isFinite(ad.priority) ? ad.priority : 0,
    frequencySeconds: Math.max(0, ad.frequencySeconds ?? 20),
    skipAfterSeconds: Math.max(0, ad.skipAfterSeconds ?? 5),
  };
}

export function filterActiveAds(ads: AdBanner[], audience: AdAudience, now = Date.now()): AdBanner[] {
  return ads
    .map(normalizeAd)
    .filter((ad) => ad.enabled && isAdScheduled(ad, now) && isAdAllowedForAudience(ad, audience))
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0) || (a.order ?? 0) - (b.order ?? 0));
}

export async function getAds(activeOnly = true): Promise<AdBanner[]> {
  const snap = await getDocs(
    query(collection(db, 'ads'), where('enabled', '==', true), limit(50))
  );
  const ads = snap.docs.map((d) => normalizeAd({ id: d.id, ...d.data() } as AdBanner));
  return activeOnly ? ads.filter((ad) => isAdScheduled(ad)) : ads;
}
