import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { AdBanner } from '@/lib/types';

export async function getAds(
  activeOnly = true,
): Promise<AdBanner[]> {
  try {
    const snap = await getDocs(
      collection(db, 'ads'),
    );

    return snap.docs
      .map((doc) => {
        const data = doc.data();

        return {
          id: doc.id,
          ...data,
        } as AdBanner;
      })
      .filter((ad) => {
        // Accept Firebase boolean as well as string/number values.
        const enabled =
          ad.enabled === true ||
          ad.enabled === 'true' ||
          ad.enabled === 1;

        return !activeOnly || enabled;
      })
      .sort(
        (a, b) =>
          Number(a.order ?? 0) -
          Number(b.order ?? 0),
      );
  } catch (error) {
    console.error(
      '4uStream Ads loading error:',
      error,
    );

    return [];
  }
}
