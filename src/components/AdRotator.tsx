'use client';

import { createPortal } from 'react-dom';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ExternalLink, Megaphone, X } from 'lucide-react';
import type { AdBanner } from '@/lib/types';

const POPUP_FIRST_DELAY_MS = 3000;
const POPUP_SESSION_KEY = '4u-popup-shown-v2';

export function AdRotator({ ads }: { ads: AdBanner[] }) {
  const banners = useMemo(() => ads.filter((ad) => (ad.placement ?? 'banner') === 'banner'), [ads]);
  const popups = useMemo(() => ads.filter((ad) => ad.placement === 'popup'), [ads]);
  const inlines = useMemo(() => ads.filter((ad) => ad.placement === 'inline'), [ads]);
  const [index, setIndex] = useState(0);
  const [popupIndex, setPopupIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const [portalReady, setPortalReady] = useState(false);
  const popupShownRef = useRef(false);

  useEffect(() => setPortalReady(true), []);

  useEffect(() => {
    if (index >= banners.length) setIndex(0);
  }, [banners.length, index]);

  useEffect(() => {
    if (banners.length < 2) return;
    const seconds = Math.max(5, banners[index]?.repeatSeconds ?? 20);
    const timer = window.setTimeout(() => {
      setIndex((current) => (current + 1) % banners.length);
    }, seconds * 1000);
    return () => window.clearTimeout(timer);
  }, [banners, index]);

  useEffect(() => {
    if (!popups.length || open) return;

    if (!popupShownRef.current) {
      try {
        popupShownRef.current = sessionStorage.getItem(POPUP_SESSION_KEY) === '1';
      } catch {}
    }

    const wasShown = popupShownRef.current;
    const delay = wasShown
      ? Math.max(5, popups[popupIndex]?.repeatSeconds ?? 20) * 1000
      : POPUP_FIRST_DELAY_MS;

    const timer = window.setTimeout(() => {
      popupShownRef.current = true;
      try { sessionStorage.setItem(POPUP_SESSION_KEY, '1'); } catch {}
      if (wasShown) setPopupIndex((current) => (current + 1) % popups.length);
      setOpen(true);
    }, delay);

    return () => window.clearTimeout(timer);
  }, [popups, popupIndex, open]);

  useEffect(() => {
    if (!open) return;
    const body = document.body;
    const html = document.documentElement;
    const scrollY = window.scrollY;
    const previous = {
      bodyOverflow: body.style.overflow,
      bodyPosition: body.style.position,
      bodyTop: body.style.top,
      bodyWidth: body.style.width,
      htmlOverflow: html.style.overflow,
    };

    body.style.overflow = 'hidden';
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.width = '100%';
    html.style.overflow = 'hidden';

    return () => {
      body.style.overflow = previous.bodyOverflow;
      body.style.position = previous.bodyPosition;
      body.style.top = previous.bodyTop;
      body.style.width = previous.bodyWidth;
      html.style.overflow = previous.htmlOverflow;
      window.scrollTo(0, scrollY);
    };
  }, [open]);

  if (!banners.length && !popups.length) return null;

  const banner = banners[index];
  const popup = popups[popupIndex];

  const closePopup = () => setOpen(false);

  const popupModal = portalReady && popup && open
    ? createPortal(
        <div
          className="fixed inset-0 z-[99999] grid place-items-center bg-black/80 px-4 py-4"
          role="dialog"
          aria-modal="true"
          aria-label={popup.title}
          onClick={(event) => { if (event.target === event.currentTarget) closePopup(); }}
        >
          <div className="relative w-full max-w-3xl max-h-[85dvh] overflow-y-auto rounded-[2rem] border border-white/15 bg-slate-950 shadow-2xl">
            <button type="button" onClick={closePopup} aria-label="Close" className="absolute top-3 end-3 z-20 h-10 w-10 rounded-full bg-black/70 border border-white/10 grid place-items-center text-white">
              <X size={18} />
            </button>
            <a href={popup.link || '#'} target={popup.link ? '_blank' : undefined} rel="noopener noreferrer" onClick={closePopup} className="block">
              <picture>
                <source media="(max-width: 640px)" srcSet={popup.mobileImage || popup.image} />
                <img src={popup.image} alt={popup.title} loading="lazy" decoding="async" className="block w-full max-h-[55dvh] object-contain bg-black" />
              </picture>
            </a>
            <div className="flex items-center justify-between gap-3 p-4">
              <div className="min-w-0 font-bold truncate">{popup.title}</div>
              {popup.link && <a href={popup.link} target="_blank" rel="noopener noreferrer" onClick={closePopup} className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-slate-950 text-xs font-black"><ExternalLink size={14} /> Open</a>}
            </div>
          </div>
        </div>,
        document.body,
      )
    : null;

  return (
    <>
      {banner && (
        <section className="ad-shell relative overflow-hidden rounded-[1.8rem] border border-white/10 shadow-2xl">
          <a href={banner.link || '#'} target={banner.link ? '_blank' : undefined} rel="noopener noreferrer" className="block">
            <picture>
              <source media="(max-width: 640px)" srcSet={banner.mobileImage || banner.image} />
              <img src={banner.image} alt={banner.title} loading="lazy" decoding="async" sizes="100vw" className="w-full h-[125px] sm:h-[180px] lg:h-[220px] object-cover" />
            </picture>
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent pointer-events-none" />
            <div className="absolute bottom-3 start-3 inline-flex items-center gap-2 rounded-full bg-black/55 border border-white/10 px-3 py-1.5 text-[11px] font-bold"><Megaphone size={13} />{banner.title}</div>
            <div className="absolute bottom-3 end-3 inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-[10px]">Open<ChevronLeft size={13} /></div>
          </a>
          {banners.length > 1 && <div className="absolute top-3 end-3 rounded-full bg-black/50 border border-white/10 px-2.5 py-1 text-[10px]">{index + 1}/{banners.length}</div>}
        </section>
      )}
      {inlines.length > 0 && (
        <section className="ad-shell mt-4 overflow-hidden rounded-2xl border border-white/10">
          <a href={inlines[0].link || '#'} target={inlines[0].link ? '_blank' : undefined} rel="noopener noreferrer" className="block">
            <picture>
              <source media="(max-width: 640px)" srcSet={inlines[0].mobileImage || inlines[0].image} />
              <img src={inlines[0].image} alt={inlines[0].title} loading="lazy" decoding="async" className="w-full max-h-52 object-cover" />
            </picture>
          </a>
        </section>
      )}
      {popupModal}
    </>
  );
}
