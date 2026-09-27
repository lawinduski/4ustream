'use client';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { defaultBranding, getBranding, type BrandingConfig } from '@/lib/branding';

const BrandingContext = createContext<BrandingConfig>(defaultBranding);
export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const [branding, setBranding] = useState(defaultBranding);
  useEffect(() => { getBranding().then(setBranding); }, []);
  useEffect(() => {
    document.title = branding.siteName || '4uStream';
    if (branding.faviconUrl) {
      let link = document.querySelector<HTMLLinkElement>('link[data-4u-favicon]');
      if (!link) { link = document.createElement('link'); link.dataset['4uFavicon'] = 'true'; link.rel = 'icon'; document.head.appendChild(link); }
      link.href = branding.faviconUrl;
    }
  }, [branding.siteName, branding.faviconUrl]);
  const value = useMemo(() => branding, [branding]);
  return <BrandingContext.Provider value={value}>{children}</BrandingContext.Provider>;
}
export function useBranding() { return useContext(BrandingContext); }
