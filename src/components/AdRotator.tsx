'use client';

import { createPortal } from 'react-dom';
import { useEffect, useMemo, useRef, useState } from 'react';
import { X, ExternalLink, Megaphone, ChevronLeft, Clock3 } from 'lucide-react';
import type { AdBanner } from '@/lib/types';
import { filterActiveAds, normalizeAd } from '@/lib/ads';
import { useApp } from '@/components/AppProvider';

const BANNER_ROTATE_MS = 5000;
const POPUP_FIRST_DELAY_MS = 3000;
const POPUP_SESSION_KEY = '4u-popup-last';
const POPUP_FALLBACK_FREQUENCY_MS = 20000;

function frequencyKey(ad: AdBanner) {
  return `${POPUP_SESSION_KEY}:${ad.id}`;
}

function canShowPopup(ad: AdBanner) {
  try {
    const last = Number(sessionStorage.getItem(frequencyKey(ad)) || 0);
    const frequency = Math.max(0, (ad.frequencySeconds ?? 20) * 1000);
    return !last || Date.now() - last >= frequency;
  } catch {
    return true;
  }
}

function markPopupShown(ad: AdBanner) {
  try {
    sessionStorage.setItem(frequencyKey(ad), String(Date.now()));
  } catch {}
}

export function AdRotator({ ads }: { ads: AdBanner[] }) {
  const { isVip } = useApp();
  const audience = isVip ? 'vip' : 'free';
  const activeAds = useMemo(() => filterActiveAds(ads, audience), [ads, audience]);
  const banners = useMemo(() => activeAds.filter((a) => (a.placement || 'banner') === 'banner'), [activeAds]);
  const popups = useMemo(() => activeAds.filter((a) => (a.placement || 'banner') === 'popup'), [activeAds]);
  const inlineAds = useMemo(() => activeAds.filter((a) => (a.placement || 'banner') === 'inline'), [activeAds]);

  const [index, setIndex] = useState(0);
  const [popupIndex, setPopupIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const [portalReady, setPortalReady] = useState(false);
  const [modalEntered, setModalEntered] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const openRef = useRef(false);

  useEffect(() => setPortalReady(true), []);

  useEffect(() => {
    if (index >= banners.length) setIndex(0);
  }, [banners.length, index]);

  useEffect(() => {
    if (banners.length < 2) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % banners.length), BANNER_ROTATE_MS);
    return () => window.clearInterval(id);
  }, [banners.length]);

  useEffect(() => { openRef.current = open; }, [open]);

  useEffect(() => {
    if (!popups.length) return;
    const first = window.setTimeout(() => {
      const eligible = popups.filter(canShowPopup);
      if (!eligible.length) return;
      const next = eligible[0];
      const nextIndex = popups.findIndex((x) => x.id === next.id);
      setPopupIndex(nextIndex >= 0 ? nextIndex : 0);
      markPopupShown(next);
      setCountdown(Math.max(0, normalizeAd(next).skipAfterSeconds ?? 5));
      setOpen(true);
    }, POPUP_FIRST_DELAY_MS);

    const interval = window.setInterval(() => {
      if (openRef.current) return;
      const eligible = popups.filter(canShowPopup);
      if (!eligible.length) return;
      const current = eligible[0];
      const nextIndex = popups.findIndex((x) => x.id === current.id);
      setPopupIndex(nextIndex >= 0 ? nextIndex : 0);
      markPopupShown(current);
      setCountdown(Math.max(0, normalizeAd(current).skipAfterSeconds ?? 5));
      setOpen(true);
    }, Math.max(POPUP_FALLBACK_FREQUENCY_MS, Math.min(...popups.map((x) => Math.max(1, x.frequencySeconds ?? 20)))*1000));

    return () => { window.clearTimeout(first); window.clearInterval(interval); };
  }, [popups]);

  useEffect(() => {
    if (!open || countdown <= 0) return;
    const id = window.setInterval(() => setCountdown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(id);
  }, [open, countdown]);

  useEffect(() => {
    if (!open) return;
    const body = document.body;
    const html = document.documentElement;
    const scrollY = window.scrollY;
    const previous = { bodyOverflow: body.style.overflow, bodyPosition: body.style.position, bodyTop: body.style.top, bodyWidth: body.style.width, htmlOverflow: html.style.overflow };
    body.style.overflow = 'hidden'; body.style.position = 'fixed'; body.style.top = `-${scrollY}px`; body.style.width = '100%'; html.style.overflow = 'hidden';
    return () => { body.style.overflow = previous.bodyOverflow; body.style.position = previous.bodyPosition; body.style.top = previous.bodyTop; body.style.width = previous.bodyWidth; html.style.overflow = previous.htmlOverflow; window.scrollTo(0, scrollY); };
  }, [open]);

  useEffect(() => {
    if (!open) { setModalEntered(false); return; }
    const frame = window.requestAnimationFrame(() => setModalEntered(true));
    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  if (isVip || (!banners.length && !popups.length && !inlineAds.length)) return null;

  const ad = banners[index];
  const pop = popups[popupIndex];
  const closePopup = () => { setModalEntered(false); setOpen(false); };
  const skipLocked = countdown > 0;

  const popupModal = portalReady && pop && open ? createPortal(
    <div className={['fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 px-4 py-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] transition-opacity duration-200', modalEntered ? 'opacity-100' : 'opacity-0'].join(' ')} role="dialog" aria-modal="true" aria-label={pop.title} onClick={(event) => { if (event.target === event.currentTarget && !skipLocked) closePopup(); }}>
      <div className={['relative w-full max-w-3xl max-h-[85dvh] overflow-y-auto overscroll-contain rounded-[2rem] border border-white/15 bg-slate-950 shadow-[0_30px_120px_rgba(0,0,0,.6)] transition-all duration-200', modalEntered ? 'scale-100 translate-y-0' : 'scale-[0.96] translate-y-2'].join(' ')} onClick={(event) => event.stopPropagation()}>
        <button type="button" onClick={closePopup} disabled={skipLocked} aria-label={skipLocked ? `Skip available in ${countdown}s` : 'Close'} className="absolute top-3 end-3 z-20 h-10 w-10 rounded-full bg-black/60 border border-white/10 grid place-items-center text-white transition hover:bg-black/80 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed">
          {skipLocked ? <span className="text-xs font-black">{countdown}</span> : <X size={18} />}
        </button>
        <a href={pop.link || '#'} target={pop.link ? '_blank' : undefined} rel="noopener noreferrer" onClick={closePopup} className="block">
          <picture><source media="(max-width: 640px)" srcSet={pop.mobileImage || pop.image} /><img src={pop.image} alt={pop.title} className="block w-full max-h-[55dvh] object-contain bg-black" /></picture>
        </a>
        <div className="flex items-center justify-between gap-3 p-4" style={{ paddingBottom: 'max(1rem, calc(1rem + env(safe-area-inset-bottom)))' }}>
          <div className="min-w-0"><div className="font-bold truncate">{pop.title}</div><div className="mt-1 text-[11px] text-slate-400 inline-flex items-center gap-1"><Clock3 size={12}/> {skipLocked ? `Skip in ${countdown}s` : 'You can close this ad'}</div></div>
          {pop.link && <a href={pop.link} target="_blank" rel="noopener noreferrer" onClick={closePopup} className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-slate-950 text-xs font-black transition active:scale-95"><ExternalLink size={14}/>Open</a>}
        </div>
      </div>
    </div>, document.body) : null;

  return <>{ad && <section className="ad-shell relative overflow-hidden rounded-[1.8rem] border border-white/10 shadow-2xl">
    <a href={ad.link || '#'} target={ad.link ? '_blank' : undefined} rel="noopener noreferrer" className="block group">
      <picture><source media="(max-width: 640px)" srcSet={ad.mobileImage || ad.image} /><img src={ad.image} alt={ad.title} loading="eager" decoding="async" sizes="100vw" className="w-full h-[125px] sm:h-[180px] lg:h-[220px] object-cover transition duration-700 group-hover:scale-[1.02]" /></picture>
      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent pointer-events-none" />
      <div className="absolute bottom-3 start-3 inline-flex items-center gap-2 rounded-full bg-black/55 border border-white/10 px-3 py-1.5 text-[11px] font-bold"><Megaphone size={13}/>{ad.title}</div>
      <div className="absolute bottom-3 end-3 inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-[10px]">Open<ChevronLeft size={13}/></div>
    </a>
    {banners.length > 1 && <div className="absolute top-3 end-3 rounded-full bg-black/50 border border-white/10 px-2.5 py-1 text-[10px]">{index+1}/{banners.length}</div>}
  </section>}{inlineAds.length > 0 && <div className="mt-4 grid gap-3">{inlineAds.slice(0,2).map((inline) => <a key={inline.id} href={inline.link || undefined} target={inline.link ? '_blank' : undefined} rel="noopener noreferrer" className="block overflow-hidden rounded-2xl border border-white/10"><picture><source media="(max-width: 640px)" srcSet={inline.mobileImage || inline.image}/><img src={inline.image} alt={inline.title} loading="lazy" decoding="async" className="w-full max-h-52 object-cover"/></picture></a>)}</div>}{popupModal}</>;
}
