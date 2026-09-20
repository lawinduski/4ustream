'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ExternalLink, Megaphone, ChevronLeft } from 'lucide-react';
import type { AdBanner } from '@/lib/types';

export function AdRotator({ ads }: { ads: AdBanner[] }) {
  const banners = useMemo(
    () => ads.filter((a) => (a.placement || 'banner') === 'banner'),
    [ads],
  );

  const popups = useMemo(
    () => ads.filter((a) => (a.placement || 'banner') === 'popup'),
    [ads],
  );

  const [index, setIndex] = useState(0);
  const [popupIndex, setPopupIndex] = useState(0);
  const [open, setOpen] = useState(false);

  // Banner rotation stays at 5 seconds.
  useEffect(() => {
    if (banners.length < 2) return;

    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % banners.length);
    }, 5000);

    return () => window.clearInterval(id);
  }, [banners.length]);

  // Popup rotation: every 15 seconds.
  useEffect(() => {
    if (!popups.length) return;

    const id = window.setInterval(() => {
      setPopupIndex((current) => (current + 1) % popups.length);
      setOpen(true);
    }, 15000);

    return () => window.clearInterval(id);
  }, [popups.length]);

  // Lock the page behind the popup while preserving the exact
  // scroll position. The fixed-body technique also works on iOS Safari.
  useEffect(() => {
    if (!open) return;

    const html = document.documentElement;
    const body = document.body;
    const scrollY = window.scrollY;

    const previousHtmlOverflow = html.style.overflow;
    const previousBodyOverflow = body.style.overflow;
    const previousBodyPosition = body.style.position;
    const previousBodyTop = body.style.top;
    const previousBodyWidth = body.style.width;

    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    body.style.position = 'fixed';
    body.style.top = '-${scrollY}px';
    body.style.width = '100%';

    return () => {
      html.style.overflow = previousHtmlOverflow;
      body.style.overflow = previousBodyOverflow;
      body.style.position = previousBodyPosition;
      body.style.top = previousBodyTop;
      body.style.width = previousBodyWidth;

      window.scrollTo(0, scrollY);
    };
  }, [open]);

  if (!banners.length && !popups.length) return null;

  const ad = banners[index];
  const pop = popups[popupIndex];

  const closePopup = () => {
    setOpen(false);
  };

  const popup =
    pop && open
      ? createPortal(
          <div
            className="ad-popup-modal fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-md px-4 py-4 sm:px-6"
            role="dialog"
            aria-modal="true"
            aria-label={pop.title}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                closePopup();
              }
            }}
            onTouchStart={(event) => {
              if (event.target === event.currentTarget) {
                closePopup();
              }
            }}
          >
            <div className="ad-popup-card relative flex max-h-[85dvh] w-full max-w-3xl flex-col overflow-y-auto overscroll-contain rounded-[2rem] border border-white/15 bg-slate-950 shadow-[0_30px_120px_rgba(0,0,0,.6)]">
              <button
                type="button"
                onClick={closePopup}
                aria-label="Close"
                className="absolute end-3 top-3 z-20 grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-black/65 text-white backdrop-blur-xl transition hover:bg-black/80 focus:outline-none focus:ring-2 focus:ring-violet-300"
              >
                <X size={18} />
              </button>

              <a
                href={pop.link || '#'}
                target={pop.link ? '_blank' : undefined}
                rel="noopener noreferrer"
                onClick={closePopup}
                className="block shrink-0 bg-black"
              >
                <picture>
                  <source
                    media="(max-width: 640px)"srcSet={pop.mobileImage || pop.image}
                  />

                  <img
                    src={pop.image}
                    alt={pop.title}
                    className="block max-h-[58dvh] w-full object-contain"
                    loading="eager"
                    decoding="async"
                  />
                </picture>
              </a>

              <div className="flex shrink-0 items-center justify-between gap-3 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:p-5 sm:pb-5">
                <div className="min-w-0 truncate text-sm font-bold text-white">
                  {pop.title}
                </div>

                {pop.link && (
                  <a
                    href={pop.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={closePopup}
                    className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-black text-slate-950 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-300"
                  >
                    <ExternalLink size={14} />
                    Open
                  </a>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      {ad && (
        <section className="ad-shell relative overflow-hidden rounded-[1.8rem] border border-white/10 shadow-2xl">
          <a
            href={ad.link || '#'}
            target={ad.link ? '_blank' : undefined}
            rel="noopener noreferrer"
            className="block group"
          >
            <picture>
              <source
                media="(max-width: 640px)"
                srcSet={ad.mobileImage || ad.image}
              />

              <img
                src={ad.image}
                alt={ad.title}
                loading="eager"
                decoding="async"
                sizes="100vw"
                className="h-[125px] w-full object-cover transition duration-700 group-hover:scale-[1.02] sm:h-[180px] lg:h-[220px]"
              />
            </picture>

            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />

            <div className="absolute bottom-3 start-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/55 px-3 py-1.5 text-[11px] font-bold backdrop-blur-xl">
              <Megaphone size={13} />
              {ad.title}
            </div>

            <div className="absolute bottom-3 end-3 inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-[10px] backdrop-blur-xl">
              Open <ChevronLeft size={13} />
            </div>
          </a>

          {banners.length > 1 && (
            <div className="absolute end-3 top-3 rounded-full border border-white/10 bg-black/50 px-2.5 py-1 text-[10px] backdrop-blur-xl">
              {index + 1}/{banners.length}
            </div>
          )}
        </section>
      )}

      {popup}
    </>
  );
}
