import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export type BrandingConfig = {
  logoUrl: string;
  mobileLogoUrl: string;
  faviconUrl: string;
  appIcon192Url: string;
  appIcon512Url: string;
  ogImageUrl: string;
  playerLogoUrl: string;
  loadingLogoUrl: string;
  defaultPosterUrl: string;
  defaultAvatarUrl: string;
  siteName: string;
  tagline: string;
  updatedAt?: unknown;
};

export const defaultBranding: BrandingConfig = {
  logoUrl: '/IMG_6501.jpeg', mobileLogoUrl: '/IMG_6501.jpeg', faviconUrl: '/IMG_6501.jpeg',
  appIcon192Url: '/IMG_6501.jpeg', appIcon512Url: '/IMG_6501.jpeg', ogImageUrl: '/IMG_6501.jpeg',
  playerLogoUrl: '/IMG_6501.jpeg', loadingLogoUrl: '/IMG_6501.jpeg', defaultPosterUrl: '/IMG_6501.jpeg',
  defaultAvatarUrl: '/IMG_6501.jpeg', siteName: '4uStream', tagline: 'Live TV, films and drama',
};

export async function getBranding(): Promise<BrandingConfig> {
  try {
    const snap = await getDoc(doc(db, 'branding', 'main'));
    return snap.exists() ? { ...defaultBranding, ...(snap.data() as Partial<BrandingConfig>) } : defaultBranding;
  } catch {
    return defaultBranding;
  }
}

export async function saveBranding(config: Partial<BrandingConfig>) {
  await setDoc(doc(db, 'branding', 'main'), { ...config, updatedAt: serverTimestamp() }, { merge: true });
}
