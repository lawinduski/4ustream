'use client';

import { createPortal } from 'react-dom';
import { useEffect, useMemo, useState } from 'react';
import { X, ExternalLink, Megaphone, ChevronLeft } from 'lucide-react';
import type { AdBanner } from '@/lib/types';

export function AdRotator({ ads }: { ads: AdBanner[] }) {
  const banners = useMemo(
    () => ads.filter((a) => (a.placement || 'banner') === 'banner'),
    [ads]
  );

  const popups = useMemo(
    () => ads.filter((a) => (a.placement || 'banner') === 'popup'),
    [ads]
  );

  const [index, setIndex] = useState(0);
  const [popupIndex, setPopupIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const [portalReady, setPortalReady] = useState(false);
  const [modalEntered, setModalEntered] = useState(false);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    if (banners.length < 2) return;

    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % banners.length);
    }, 5000);

    return () => window.clearInterval(id);
  }, [banners.length]);

  useEffect(() => {
    if (!popups.length) return;

    const id = window.setInterval(() => {
      setPopupIndex((i) => (i + 1) % popups.length);
      setOpen(true);
    }, 5000);

    return () => window.clearInterval(id);
  }, [popups.length]);

  /*
   * Lock the background page while the popup is open.
   * The fixed-body approach is more reliable on iOS Safari
   * than using only overflow:hidden.
   */
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
    body.style.top = '-${scrollY}px';
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

  /*
   * Small fade/scale entrance animation.
   */
  useEffect(() => {
    if (!open) {
      setModalEntered(false);
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      setModalEntered(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  if (!banners.length && !popups.length) return null;

  const ad = banners[index];
  const pop = popups[popupIndex];

  const closePopup = () => {
    setModalEntered(false);
    setOpen(false);
  };

  const popupModal =
    portalReady && pop && open
      ? createPortal(
          <div
            className={[
              'fixed inset-0 z-[99999]',
              'flex items-center justify-center',
              'bg-black/70 backdrop-blur-md',
              'px-4 py-4',
              'pt-[max(1rem,env(safe-area-inset-top))]',
              'pb-[max(1rem,env(safe-area-inset-bottom))]',
              'transition-opacity duration-200 ease-out',
              modalEntered ? 'opacity-100' : 'opacity-0',
            ].join(' ')}
            role="dialog"
            aria-modal="true"
            aria-label={pop.title}
            onClick={(event) => {
              if (event.target === event.currentTarget) {
                closePopup();
              }
            }}
          >
            <div
              className={[
                'relative w-full max-w-3xl',
                'max-h-[85dvh]',
                'overflow-y-auto overscroll-contain',
                'rounded-[2rem]',
                'border border-white/15',
                'bg-slate-950',
                'shadow-[0_30px_120px_rgba(0,0,0,.6)]',
                'transition-all duration-200 ease-out',
                modalEntered
                  ? 'scale-100 translate-y-0'
                  : 'scale-[0.96] translate-y-2',
              ].join(' ')}
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={closePopup}
                aria-label="Close"
                className="absolute top-3 end-3 z-20 h-10 w-10 rounded-full bg-black/60 backdrop-blur-xl border border-white/10 grid place-items-center text-white transition hover:bg-black/80 active:scale-95"
              >
                <X size={18} />
              </button>

              <a
                href={pop.link || '#'}
                target={pop.link ? '_blank' : undefined}
                rel="noopener noreferrer"
                onClick={closePopup}
                className="block"
              >
                <picture>
                  <source
                    media="(max-width: 640px)"
                    srcSet={pop.mobileImage || pop.image}
                  />

                  <img
                    src={pop.image}
                    alt={pop.title}
                    className="block w-full max-h-[55dvh] object-contain bg-black"
                  />
                </picture>
              </a>

              <div
                className="flex items-center justify-between gap-3 p-4"
                style={{
                  paddingBottom:
                    'max(1rem, calc(1rem + env(safe-area-inset-bottom)))',
                }}
              >
                <div className="min-w-0 font-bold truncate">
                  {pop.title}
                </div>

                {pop.link && (
                  <a
                    href={pop.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={closePopup}
                    className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-slate-950 text-xs font-black transition active:scale-95"
                  >
                    <ExternalLink size={14} />
                    Open
                  </a>
                )}
              </div>
            </div>
          </div>,
          document.body
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
                className="w-full h-[125px] sm:h-[180px] lg:h-[220px] object-cover transition duration-700 group-hover:scale-[1.02]"
              />
            </picture>

            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent pointer-events-none" />

            <div className="absolute bottom-3 start-3 inline-flex items-center gap-2 rounded-full bg-black/55 backdrop-blur-xl border border-white/10 px-3 py-1.5 text-[11px] font-bold">
              <Megaphone size={13} />
              {ad.title}
            </div>

            <div className="absolute bottom-3 end-3 inline-flex items-center gap-1 rounded-full bg-white/10 backdrop-blur-xl px-3 py-1.5 text-[10px]">
              Open
              <ChevronLeft size={13} />
            </div>
          </a>

          {banners.length > 1 && (
            <div className="absolute top-3 end-3 rounded-full bg-black/50 backdrop-blur-xl border border-white/10 px-2.5 py-1 text-[10px]">
              {index + 1}/{banners.length}
            </div>
          )}
        </section>
      )}

      {popupModal}
    </>
  );
}
