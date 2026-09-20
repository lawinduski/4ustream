import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { AdBanner } from '@/lib/types';

export async function getAds(activeOnly = true): Promise<AdBanner[]> {
  const snap = await getDocs(
    query(collection(db, 'ads'), where('enabled', '==', true))
  );
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() } as AdBanner))
    .filter(x => !activeOnly || x.enabled === true)
    .sort((a,b) => (a.order ?? 0) - (b.order ?? 0));
}
