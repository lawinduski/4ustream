import { collection, getDocs, limit, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { AdAudience, AdBanner } from '@/lib/types';

export async function getAds(
  activeOnly = true,
  audience?: Exclude<AdAudience, 'both'>,
  maxResults = 12,
): Promise<AdBanner[]> {
  const constraints = activeOnly ? [where('enabled', '==', true)] : [];
  if (audience) {
    constraints.push(where('audience', 'in', [audience, 'both']));
  }
  const base = constraints.length ? query(collection(db, 'ads'), ...constraints) : collection(db, 'ads');
  const snap = await getDocs(maxResults > 0 ? query(base, limit(maxResults)) : base);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as AdBanner)
    .filter((ad) => !activeOnly || ad.enabled === true)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}
